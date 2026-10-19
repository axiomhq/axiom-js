import { Transport } from './transport';
import { LogEvent, LogLevelValue, LogLevel } from '../logger';
import { safeStringify } from '../internal/safe-stringify';

interface FetchConfig {
  input: Parameters<typeof fetch>[0];
  init?: Omit<NonNullable<Parameters<typeof fetch>[1]>, 'body'>;
  autoFlush?: boolean | { durationMs: number };
  logLevel?: LogLevel;
}

const MAX_EVENTS = 1_000;
const BATCH_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 1_000;
const WARNING_INTERVAL_MS = 30_000;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

type QueuedEvent = { sequence: number; event: LogEvent };
type FlushWaiter = { through: number; resolve: () => void };

function retryAfterMs(value: string | null): number | undefined {
  if (value === null) return undefined;
  if (/^\d+$/.test(value.trim())) {
    const delay = Number(value) * 1_000;
    return Number.isFinite(delay) ? delay : undefined;
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

export class SimpleFetchTransport implements Transport {
  private fetchConfig: FetchConfig;
  private events: QueuedEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private inFlight: QueuedEvent[] = [];
  private sequence = 0;
  private requestedThrough = 0;
  private waiters = new Set<FlushWaiter>();
  private retryAfterUntil = 0;
  private lastWarningAt = -Infinity;
  private dropped: Record<string, number> = {};

  constructor(config: FetchConfig) {
    this.fetchConfig = config;
  }

  log: Transport['log'] = (logs) => {
    let dropped = 0;
    for (const event of logs) {
      if (
        !(
          LogLevelValue[(event.level as LogLevel) ?? LogLevel.info] >=
          LogLevelValue[this.fetchConfig.logLevel ?? LogLevel.info]
        )
      ) {
        continue;
      }
      if (this.events.length === MAX_EVENTS) {
        this.events.shift();
        dropped += 1;
      }
      this.events.push({ sequence: ++this.sequence, event });
    }
    this.settleWaiters();
    if (dropped > 0) this.reportDrop('overflow', dropped);

    const autoFlush = this.fetchConfig.autoFlush;
    if (autoFlush === undefined || autoFlush === false || this.events.length === 0) return;

    if (this.events.length === MAX_EVENTS && !this.flushing) {
      void this.flush();
    } else if (this.timer === null) {
      const delay = typeof autoFlush === 'boolean' ? 2_000 : autoFlush.durationMs;
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, delay);
    }
  };

  /** Wait for events accepted before this call to be sent or explicitly dropped. */
  async flush(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const through = this.sequence;
    if (through < this.oldestOutstanding()) return;

    const completed = new Promise<void>((resolve) => this.waiters.add({ through, resolve }));
    this.requestedThrough = through;
    if (!this.flushing) {
      // Set this before entering the async worker, including when fetch throws synchronously.
      this.flushing = true;
      void this.drain();
    }
    await completed;
  }

  private oldestOutstanding(): number {
    return this.inFlight[0]?.sequence ?? this.events[0]?.sequence ?? this.sequence + 1;
  }

  private settleWaiters(): void {
    const oldest = this.oldestOutstanding();
    for (const waiter of this.waiters) {
      if (waiter.through < oldest) {
        this.waiters.delete(waiter);
        waiter.resolve();
      }
    }
  }

  private async drain(): Promise<void> {
    try {
      while (this.events.length > 0 && this.events[0].sequence <= this.requestedThrough) {
        const next = this.events.findIndex((event) => event.sequence > this.requestedThrough);
        this.inFlight = this.events.splice(0, next < 0 ? this.events.length : next);
        const reason = await this.sendBatch(this.inFlight.map(({ event }) => event));
        if (reason) this.reportDrop(reason, this.inFlight.length);
        this.inFlight = [];
        this.settleWaiters();
      }
    } finally {
      this.flushing = false;
    }
  }

  /** One retry, sharing a deadline with the first attempt and any backoff. */
  private async sendBatch(events: LogEvent[]): Promise<string | undefined> {
    const controller = new AbortController();
    const { input, init } = this.fetchConfig;
    const callerSignal = init?.signal !== undefined ? init.signal : input instanceof Request ? input.signal : undefined;
    const abortFromCaller = () => controller.abort();
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
    if (callerSignal?.aborted) controller.abort();
    const deadline = Date.now() + BATCH_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
    let onAbort: () => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      onAbort = () => reject(new Error('Log batch aborted'));
      controller.signal.addEventListener('abort', onAbort, { once: true });
    });
    // A log's toJSON can cancel the caller signal before we enter a request or delay race.
    void aborted.catch(() => {});
    const pause = async (delay: number) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([new Promise<void>((resolve) => (timer = setTimeout(resolve, delay))), aborted]);
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      const body = safeStringify(events);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (controller.signal.aborted || Date.now() >= deadline) {
          return callerSignal?.aborted ? 'cancelled' : 'timeout';
        }
        const cooldown = Math.max(0, this.retryAfterUntil - Date.now());
        if (cooldown >= deadline - Date.now()) return 'server backoff';
        if (cooldown > 0) await pause(cooldown);
        if (controller.signal.aborted || Date.now() >= deadline) {
          return callerSignal?.aborted ? 'cancelled' : 'timeout';
        }

        let response: Response;
        try {
          response = await Promise.race([
            Promise.resolve().then(() =>
              fetch(this.fetchConfig.input, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                ...this.fetchConfig.init,
                body,
                signal: controller.signal,
              }),
            ),
            aborted,
          ]);
        } catch {
          if (controller.signal.aborted) return callerSignal?.aborted ? 'cancelled' : 'timeout';
          if (attempt === 1) return 'network error';
          if (RETRY_DELAY_MS >= deadline - Date.now()) return 'timeout';
          await pause(RETRY_DELAY_MS);
          continue;
        }

        // We only need the status and headers; do not buffer an arbitrary response body.
        void response.body?.cancel().catch(() => {});
        if (response.ok) return;
        const retryDelay = retryAfterMs(response.headers.get('Retry-After'));
        if (RETRYABLE_STATUSES.has(response.status) && retryDelay !== undefined) {
          this.retryAfterUntil = Math.max(this.retryAfterUntil, Date.now() + retryDelay);
        }
        if (!RETRYABLE_STATUSES.has(response.status) || attempt === 1) return `HTTP ${response.status}`;
        const delay = Math.max(RETRY_DELAY_MS, retryDelay ?? 0);
        if (delay >= deadline - Date.now()) return 'server backoff';
        await pause(delay);
      }
    } catch {
      return callerSignal?.aborted ? 'cancelled' : controller.signal.aborted ? 'timeout' : 'request error';
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', abortFromCaller);
      controller.signal.removeEventListener('abort', onAbort);
    }
  }

  private reportDrop(reason: string, count: number): void {
    this.dropped[reason] = (this.dropped[reason] ?? 0) + count;
    if (Date.now() - this.lastWarningAt < WARNING_INTERVAL_MS) return;
    const dropped = this.dropped;
    this.dropped = {};
    this.lastWarningAt = Date.now();
    try {
      console.warn('[Axiom] Dropped log events:', dropped);
    } catch {
      // Diagnostics must not break the application or stop future flushes.
    }
  }
}
