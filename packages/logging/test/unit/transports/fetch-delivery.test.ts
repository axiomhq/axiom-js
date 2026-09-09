import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogLevel } from '../../../src/logger';
import { SimpleFetchTransport } from '../../../src/transports/fetch';
import { createLogEvent } from '../../lib/mock';

const API_URL = 'https://api.example.com/logs';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function response(status = 204, headers?: HeadersInit): Response {
  return new Response(null, { status, headers });
}

async function settlePromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, call = 0): Array<{ message: string }> {
  return JSON.parse(String(fetchMock.mock.calls[call][1]?.body));
}

describe('SimpleFetchTransport delivery', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn(() => Promise.resolve(response()));
    vi.stubGlobal('fetch', fetchMock);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('snapshots each flush and keeps requests serial', async () => {
    const firstRequest = deferred<Response>();
    fetchMock.mockImplementationOnce(() => firstRequest.promise);

    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'first')]);
    const firstFlush = transport.flush();
    await settlePromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestBody(fetchMock)).toEqual([expect.objectContaining({ message: 'first' })]);

    transport.log([createLogEvent(LogLevel.info, 'second')]);
    let secondFlushResolved = false;
    const secondFlush = transport.flush().then(() => {
      secondFlushResolved = true;
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    firstRequest.resolve(response());
    await firstFlush;
    await settlePromises();

    expect(secondFlushResolved).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBody(fetchMock, 1)).toEqual([expect.objectContaining({ message: 'second' })]);

    await secondFlush;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('limits queued events to 1000 and drops the oldest queued events', async () => {
    const firstRequest = deferred<Response>();
    fetchMock.mockImplementationOnce(() => firstRequest.promise);

    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log(Array.from({ length: 1_000 }, (_, i) => createLogEvent(LogLevel.info, `inflight-${i}`)));
    const firstFlush = transport.flush();
    await settlePromises();
    expect(requestBody(fetchMock)).toHaveLength(1_000);

    transport.log(Array.from({ length: 1_000 }, (_, i) => createLogEvent(LogLevel.info, `queued-${i}`)));
    transport.log([createLogEvent(LogLevel.info, 'newest')]);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('queued-999');

    firstRequest.resolve(response());
    await firstFlush;

    const secondFlush = transport.flush();
    await secondFlush;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBody(fetchMock, 1)).toHaveLength(1_000);
    expect(requestBody(fetchMock, 1)[0].message).toBe('queued-1');
    expect(requestBody(fetchMock, 1).at(-1)?.message).toBe('newest');
  });

  it('throttles drop warnings and reports aggregated reasons without event payloads', async () => {
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log(Array.from({ length: 1_000 }, (_, i) => createLogEvent(LogLevel.info, `kept-${i}`)));

    transport.log([createLogEvent(LogLevel.info, 'dropped-first')]);
    transport.log([createLogEvent(LogLevel.info, 'dropped-second')]);
    await vi.advanceTimersByTimeAsync(29_999);
    transport.log([createLogEvent(LogLevel.info, 'dropped-third')]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    transport.log([createLogEvent(LogLevel.info, 'dropped-fourth')]);
    expect(warnSpy).toHaveBeenCalledTimes(2);

    const warningText = JSON.stringify(warnSpy.mock.calls);
    expect(warningText).toMatch(/overflow|queue|drop/i);
    expect(warnSpy).toHaveBeenNthCalledWith(2, expect.any(String), { overflow: 3 });
    expect(warningText).not.toContain('dropped-first');
    expect(warningText).not.toContain('dropped-second');
    expect(warningText).not.toContain('dropped-third');
    expect(warningText).not.toContain('dropped-fourth');
  });

  it.each([429, 500, 502, 503, 504])('retries transient HTTP %s once after 1000ms', async (status) => {
    fetchMock.mockResolvedValueOnce(response(status)).mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent()]);

    const flushPromise = transport.flush();
    await settlePromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromise;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('honors Retry-After seconds for transient responses', async () => {
    fetchMock.mockResolvedValueOnce(response(429, { 'Retry-After': '2' })).mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent()]);
    const flushPromise = transport.flush();
    await settlePromises();

    await vi.advanceTimersByTimeAsync(1_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromise;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('honors Retry-After HTTP dates', async () => {
    vi.setSystemTime(new Date('2026-09-09T00:00:00.000Z'));
    const retryAt = new Date(Date.now() + 3_000).toUTCString();
    fetchMock.mockResolvedValueOnce(response(429, { 'Retry-After': retryAt })).mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent()]);
    const flushPromise = transport.flush();
    await settlePromises();

    await vi.advanceTimersByTimeAsync(2_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromise;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('drops a batch immediately when Retry-After exceeds the 10000ms batch budget', async () => {
    fetchMock.mockResolvedValueOnce(response(429, { 'Retry-After': '11' }));
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'too-late')]);

    const flushPromise = transport.flush();
    await settlePromises();
    await flushPromise;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401])('does not retry permanent HTTP %s responses', async (status) => {
    fetchMock.mockResolvedValueOnce(response(status));
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent()]);

    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('drops a batch after its one retry and keeps the worker available', async () => {
    fetchMock
      .mockResolvedValueOnce(response(500))
      .mockResolvedValueOnce(response(500))
      .mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'exhausted')]);
    const failedFlush = transport.flush();
    await settlePromises();

    await vi.advanceTimersByTimeAsync(1_000);
    await failedFlush;
    expect(fetchMock).toHaveBeenCalledTimes(2);

    transport.log([createLogEvent(LogLevel.info, 'after-exhaustion')]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(requestBody(fetchMock, 2)[0].message).toBe('after-exhaustion');
  });

  it('remembers server cooldown across batches and suppresses requests until it expires', async () => {
    fetchMock
      .mockResolvedValueOnce(response(429, { 'Retry-After': '5' }))
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'first')]);
    const firstFlush = transport.flush();
    await settlePromises();

    transport.log([createLogEvent(LogLevel.info, 'during-cooldown')]);
    const duringCooldownFlush = transport.flush();
    await settlePromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(4_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await firstFlush;
    await duringCooldownFlush;
    transport.log([createLogEvent(LogLevel.info, 'after-cooldown')]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(requestBody(fetchMock, 1)[0].message).toBe('first');
    expect(requestBody(fetchMock, 2)[0].message).toBe('during-cooldown');
    expect(requestBody(fetchMock, 3)[0].message).toBe('after-cooldown');
  });

  it('aborts a retry when the caller signal aborts and remains usable for later flushes', async () => {
    const controller = new AbortController();
    const init: RequestInit = { signal: controller.signal };
    fetchMock.mockResolvedValueOnce(response(500)).mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, init, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'aborted')]);
    const flushPromise = transport.flush();
    await settlePromises();

    controller.abort();
    await flushPromise;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    init.signal = undefined;
    transport.log([createLogEvent(LogLevel.info, 'future')]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBody(fetchMock, 1)[0].message).toBe('future');
  });

  it('aborts a hung request at the 10000ms batch deadline, including retry time', async () => {
    let retrySignal: AbortSignal | undefined;
    fetchMock
      .mockResolvedValueOnce(response(500))
      .mockImplementationOnce((_input: unknown, requestInit: RequestInit = {}) => {
        retrySignal = requestInit.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          requestInit.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      });
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent()]);
    const flushPromise = transport.flush();
    await settlePromises();

    await vi.advanceTimersByTimeAsync(1_000);
    await settlePromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(8_999);
    expect(retrySignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromise;
    expect(retrySignal?.aborted).toBe(true);
  });

  it('recovers after synchronous fetch failures and does not leave the worker stuck', async () => {
    fetchMock
      .mockImplementationOnce(() => {
        throw new Error('first synchronous failure');
      })
      .mockImplementationOnce(() => {
        throw new Error('second synchronous failure');
      })
      .mockResolvedValueOnce(response());
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'failed')]);
    const firstFlush = transport.flush();
    await settlePromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);
    await firstFlush;
    expect(fetchMock).toHaveBeenCalledTimes(2);

    transport.log([createLogEvent(LogLevel.info, 'recovered')]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(requestBody(fetchMock, 2)[0].message).toBe('recovered');
  });

  it('finishes a flush even when every request produces more logs', async () => {
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    fetchMock.mockImplementation(() => {
      // Stop after ten calls so the old drain-until-empty implementation fails without hanging.
      if (fetchMock.mock.calls.length < 10) transport.log([createLogEvent(LogLevel.info, 'later')]);
      return Promise.resolve(response());
    });
    transport.log([createLogEvent(LogLevel.info, 'initial')]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('settles a flush whose queued events were evicted after its in-flight batch completes', async () => {
    const firstRequest = deferred<Response>();
    fetchMock.mockImplementationOnce(() => firstRequest.promise);
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent(LogLevel.info, 'in-flight')]);
    const firstFlush = transport.flush();
    transport.log([createLogEvent(LogLevel.info, 'evicted')]);
    const secondFlush = transport.flush();
    transport.log(Array.from({ length: 1_000 }, () => createLogEvent(LogLevel.info, 'later')));
    firstRequest.resolve(response());
    await Promise.all([firstFlush, secondFlush]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retains a long server cooldown after dropping the failed batch', async () => {
    fetchMock.mockResolvedValueOnce(response(429, { 'Retry-After': '60' }));
    const transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
    transport.log([createLogEvent()]);
    await transport.flush();
    transport.log([createLogEvent()]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    transport.log([createLogEvent()]);
    await transport.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('inherits cancellation from a Request input', async () => {
    const controller = new AbortController();
    const input = new Request(API_URL, { signal: controller.signal });
    fetchMock.mockResolvedValueOnce(response(500));
    const transport = new SimpleFetchTransport({ input, autoFlush: false });
    transport.log([createLogEvent()]);
    const flushPromise = transport.flush();
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await flushPromise;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not send with an already aborted signal or leave timeout timers behind', async () => {
    const controller = new AbortController();
    controller.abort();
    const transport = new SimpleFetchTransport({ input: API_URL, init: { signal: controller.signal } });
    transport.log([createLogEvent()]);
    await transport.flush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('handles cancellation triggered by log serialization without an unhandled rejection', async () => {
    const controller = new AbortController();
    const transport = new SimpleFetchTransport({ input: API_URL, init: { signal: controller.signal } });
    transport.log([
      createLogEvent(LogLevel.info, 'cancel during serialization', {
        toJSON: () => {
          controller.abort();
          return {};
        },
      }),
    ]);
    await transport.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
