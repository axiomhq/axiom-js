import { describe, expect, it, vi } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { Axiom, AxiomWithoutBatching } from '@axiomhq/js';
import { Logger } from '../../../src/logger';
import { AxiomJSTransport } from '../../../src/transports/axiom-js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

async function turn() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function fixture(batched = false) {
  const requests = new Map<string, ReturnType<typeof deferred<Response>>>();
  const received = new Map<string, ReturnType<typeof deferred<void>>>();
  const onError = vi.fn();
  const fetch: typeof globalThis.fetch = async (_url, init) => {
    const body = init?.body as Uint8Array;
    const bytes = new Headers(init?.headers).get('content-encoding') === 'gzip' ? gunzipSync(body) : body;
    const event = JSON.parse(Buffer.from(bytes).toString());
    const request = deferred<Response>();
    requests.set(event.message, request);
    received.get(event.message)?.resolve();
    return request.promise;
  };
  const Client = batched ? Axiom : AxiomWithoutBatching;
  const client = new Client({ token: 'offline-test-placeholder', fetch, onError });
  const logger = new Logger({ transports: [new AxiomJSTransport({ axiom: client, dataset: 'test-dataset' })] });
  return {
    logger,
    onError,
    async request(message: string) {
      if (!requests.has(message)) {
        const ready = deferred<void>();
        received.set(message, ready);
        await ready.promise;
      }
      return {
        finish(status = 200) {
          requests
            .get(message)!
            .resolve(
              Response.json(
                status === 200
                  ? { ingested: 1, failed: 0, processedBytes: 1, blocksCreated: 0, walLength: 0 }
                  : { message: 'test rejection' },
                { status },
              ),
            );
        },
      };
    },
  };
}

describe('AxiomJSTransport flush ownership', () => {
  it.each([200, 422])('retains requests logged during a flush ending with HTTP %i', async (status) => {
    const f = fixture();
    const { logger } = f;
    logger.info('first');
    const first = await f.request('first');
    const firstFlush = logger.flush();
    logger.info('second');
    const second = await f.request('second');
    first.finish(status);
    await firstFlush;
    let finished = false;
    const secondFlush = logger.flush().then(() => (finished = true));
    try {
      await turn();
      expect(finished).toBe(false);
    } finally {
      second.finish();
      await secondFlush;
    }
  });

  it('keeps overlapping flushes waiting for an older unfinished request', async () => {
    const f = fixture();
    f.logger.info('first');
    const first = await f.request('first');
    const firstFlush = f.logger.flush();
    f.logger.info('second');
    const second = await f.request('second');
    let finished = false;
    const secondFlush = f.logger.flush().then(() => (finished = true));
    second.finish();
    try {
      await turn();
      expect(finished).toBe(false);
    } finally {
      first.finish();
      await Promise.all([firstFlush, secondFlush]);
    }
  });

  it('does not let a completed earlier flush clear a third request', async () => {
    const f = fixture();
    f.logger.info('first');
    const first = await f.request('first');
    const firstFlush = f.logger.flush();
    f.logger.info('second');
    const second = await f.request('second');
    const secondFlush = f.logger.flush();
    first.finish();
    await firstFlush;
    f.logger.info('third');
    const third = await f.request('third');
    second.finish();
    await secondFlush;
    let finished = false;
    const thirdFlush = f.logger.flush().then(() => (finished = true));
    try {
      await turn();
      expect(finished).toBe(false);
    } finally {
      third.finish();
      await thirdFlush;
    }
  });

  it('keeps the batched client path awaiting its later batch', async () => {
    const f = fixture(true);
    f.logger.info('first');
    const firstFlush = f.logger.flush();
    const first = await f.request('first');
    f.logger.info('second');
    first.finish();
    await firstFlush;
    let finished = false;
    const secondFlush = f.logger.flush().then(() => (finished = true));
    const second = await f.request('second');
    try {
      await turn();
      expect(finished).toBe(false);
    } finally {
      second.finish();
      await secondFlush;
    }
  });

  it('waits for remaining requests when an ingest promise rejects', async () => {
    const second = deferred<void>();
    let rejectFirst!: (error: Error) => void;
    const rejected = new Promise<never>((_resolve, reject) => (rejectFirst = reject));
    const client = Object.create(AxiomWithoutBatching.prototype, {
      ingest: { value: vi.fn().mockReturnValueOnce(rejected).mockReturnValueOnce(second.promise) },
      appendAxiomClient: { value: vi.fn() },
    });
    const logger = new Logger({ transports: [new AxiomJSTransport({ axiom: client, dataset: 'test-dataset' })] });
    logger.info('first');
    logger.info('second');
    let finished = false;
    const flush = logger.flush().then(() => (finished = true));
    rejectFirst(new Error('ingest failed'));
    try {
      await turn();
      expect(finished).toBe(false);
    } finally {
      second.resolve();
      await flush;
    }
  });

  it('handles an ingest rejection before a later flush', async () => {
    const client = new AxiomWithoutBatching({ token: 'offline-test-placeholder' });
    vi.spyOn(client, 'ingest').mockRejectedValueOnce(new Error('ingest failed'));
    const logger = new Logger({ transports: [new AxiomJSTransport({ axiom: client, dataset: 'test-dataset' })] });
    logger.info('first');
    await turn();
    await expect(logger.flush()).resolves.toBeUndefined();
  });

  it('retains a log emitted reentrantly by the SDK error handler', async () => {
    const f = fixture();
    f.onError.mockImplementation(() => f.logger.info('second'));
    f.logger.info('first');
    const first = await f.request('first');
    const firstFlush = f.logger.flush();
    first.finish(422);
    await firstFlush;
    const second = await f.request('second');
    let finished = false;
    const secondFlush = f.logger.flush().then(() => (finished = true));
    try {
      await turn();
      expect(finished).toBe(false);
    } finally {
      second.finish();
      await secondFlush;
    }
  });
});
