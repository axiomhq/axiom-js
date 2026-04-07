import { IngestOptions, IngestStatus } from "./client.js";

/**
 * Transport callback used by {@link Batch} to send queued events.
 */
export type IngestFunction = (
  id: string,
  events: Array<object> | object,
  options?: IngestOptions,
) => Promise<IngestStatus>;

/**
 * Runtime configuration for a {@link Batch} instance.
 */
export interface BatchConfig {
  /**
   * Maximum number of queued events before triggering an immediate flush.
   * @defaultValue 1000
   */
  maxBatchSize?: number;
  /**
   * Maximum time in milliseconds between successful flush attempts.
   * @defaultValue 1000
   */
  flushIntervalMs?: number;
  /**
   * Error hook used for background flush failures.
   */
  onError?: (error: unknown) => void;
  /**
   * Clock function used for flush timing; primarily useful for tests.
   */
  now?: () => number;
}

/**
 * Internal batch lifecycle state.
 */
export type BatchState = "idle" | "scheduled" | "flushing";

const DEFAULT_MAX_BATCH_SIZE = 1000;
const DEFAULT_FLUSH_INTERVAL_MS = 1000;

/**
 * Builds a deterministic key for grouping events into a single batch queue.
 *
 * The key includes dataset identity and ingest options that influence server
 * parsing so incompatible payloads do not share the same queue.
 */
export function createBatchKey(id: string, options?: IngestOptions): string {
  return `${id}:${options?.timestampField || "-"}:${options?.timestampFormat || "-"}:${options?.csvDelimiter || "-"}`;
}

/**
 * In-memory FIFO event queue with time/size-based flushing.
 *
 * Events are buffered and flushed either when enough events have accumulated or
 * when the flush interval elapses. Flushes are serialized to preserve ordering.
 */
export class Batch {
  ingestFn: IngestFunction;
  id: string;
  options?: IngestOptions;

  events: Array<object> = [];
  state: BatchState = "idle";

  activeFlush: Promise<IngestStatus | void> = Promise.resolve();
  nextFlush?: ReturnType<typeof setTimeout>;
  lastFlush: Date = new Date();

  private maxBatchSize: number;
  private flushIntervalMs: number;
  private onError?: (error: unknown) => void;
  private now: () => number;

  /**
   * Creates a background batch queue for one dataset/options combination.
   */
  constructor(ingestFn: IngestFunction, id: string, options?: IngestOptions, config?: BatchConfig) {
    this.ingestFn = ingestFn;
    this.id = id;
    this.options = options;
    this.maxBatchSize = config?.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
    this.flushIntervalMs = config?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.onError = config?.onError;
    this.now = config?.now ?? Date.now;
  }

  /**
   * Appends event(s) to the queue and triggers or schedules a flush.
   *
   * This method is intentionally fire-and-forget. Background flush failures are
   * reported through the configured `onError` callback.
   */
  ingest = (events: Array<object> | object) => {
    this.enqueue(events);

    if (this.shouldFlushNow()) {
      this.startBackgroundFlush();
      return;
    }

    this.scheduleFlush();
  };

  /**
   * Flushes currently queued events and resolves when this flush finishes.
   *
   * Flushes are serialized with any in-flight flush to avoid concurrent sends.
   */
  flush = async (): Promise<IngestStatus | undefined> => {
    const events = this.drainEvents();
    this.clearScheduledFlush();
    const previousFlush = this.activeFlush;

    const flushPromise = (async (): Promise<IngestStatus | undefined> => {
      this.state = "flushing";
      // Keep flushes serialized but don't allow previous failures to poison
      // all future flushes.
      await previousFlush.catch(() => undefined);

      if (events.length === 0) {
        this.lastFlush = new Date(this.now());
        if (this.state !== "scheduled") {
          this.state = "idle";
        }
        return;
      }

      try {
        return await this.ingestFn(this.id, events, this.options);
      } finally {
        this.lastFlush = new Date(this.now());
        if (this.state !== "scheduled") {
          this.state = "idle";
        }
      }
    })();

    this.activeFlush = flushPromise;
    return await flushPromise;
  };

  /**
   * Appends events to the queue while preserving FIFO order.
   */
  private enqueue = (events: Array<object> | object) => {
    if (Array.isArray(events)) {
      this.events.push(...events);
      return;
    }

    this.events.push(events);
  };

  /**
   * Drains the current queue in O(1) by swapping array references.
   */
  private drainEvents = (): Array<object> => {
    const events = this.events;
    this.events = [];
    return events;
  };

  /**
   * Returns true when queue size or elapsed time requires an immediate flush.
   */
  private shouldFlushNow = (): boolean => {
    return this.events.length >= this.maxBatchSize || this.lastFlush.getTime() < this.now() - this.flushIntervalMs;
  };

  /**
   * Schedules a deferred flush to ensure low-volume traffic is eventually sent.
   */
  private scheduleFlush = () => {
    this.clearScheduledFlush();
    this.state = "scheduled";

    this.nextFlush = setTimeout(() => {
      this.startBackgroundFlush();
    }, this.flushIntervalMs);
  };

  /**
   * Starts a flush without awaiting it and forwards failures to `onError`.
   */
  private startBackgroundFlush = () => {
    const flushPromise = this.flush();
    void flushPromise.catch((error) => {
      this.onError?.(error);
      return;
    });
  };

  /**
   * Cancels a pending timer-based flush, if one exists.
   */
  private clearScheduledFlush = () => {
    if (!this.nextFlush) {
      return;
    }

    clearTimeout(this.nextFlush);
    this.nextFlush = undefined;
  };
}
