import { describe, beforeEach, afterEach, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { SimpleFetchTransport } from '../../../src/transports/fetch';
import { http, HttpResponse, HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { createLogEvent } from '../../lib/mock';
import { LogLevel } from 'src/logger';

describe('SimpleFetchTransport', () => {
  let transport: SimpleFetchTransport;
  const API_URL = 'https://api.example.com/logs';

  const handlers: HttpHandler[] = [
    http.post(API_URL, async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json({ success: true, receivedLogs: body });
    }),
  ];

  const server = setupServer(...handlers);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    beforeEach(() => {
      transport = new SimpleFetchTransport({
        input: API_URL,
        autoFlush: false,
      });
    });

    it('should not flush automatically when autoFlush is false', async () => {
      const requestSpy = vi.fn();
      server.use(
        http.post(API_URL, async () => {
          requestSpy();
          return HttpResponse.json({ success: true });
        }),
      );

      transport.log([createLogEvent()]);
      await vi.runAllTimersAsync();

      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('should flush logs when manually called', async () => {
      let receivedBody: any;
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedBody = await request.json();
          return HttpResponse.json({ success: true });
        }),
      );

      const logEvent = createLogEvent();
      transport.log([logEvent]);
      await transport.flush();

      expect(receivedBody).toEqual([logEvent]);
    });

    it('should not make request when there are no events to flush', async () => {
      const requestSpy = vi.fn();
      server.use(
        http.post(API_URL, async () => {
          requestSpy();
          return HttpResponse.json({ success: true });
        }),
      );

      await transport.flush();
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('drops permanent request failures and continues with later logs', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const receivedMessages: string[][] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          const logs = (await request.json()) as Array<{ message: string }>;
          receivedMessages.push(logs.map((log) => log.message));
          return receivedMessages.length === 1
            ? HttpResponse.json({ error: true }, { status: 400 })
            : HttpResponse.json({ success: true });
        }),
      );

      transport.log([createLogEvent(LogLevel.error, 'failed')]);
      await transport.flush();
      transport.log([createLogEvent(LogLevel.info, 'next')]);
      await transport.flush();

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(receivedMessages).toEqual([['failed'], ['next']]);
      consoleWarnSpy.mockRestore();
    });

    it('allows subclasses to override flush', async () => {
      class CustomFetchTransport extends SimpleFetchTransport {
        flushCalls = 0;

        override async flush(): Promise<void> {
          this.flushCalls += 1;
          await super.flush();
        }
      }

      const customTransport = new CustomFetchTransport({ input: API_URL, autoFlush: false });
      customTransport.log([createLogEvent()]);
      await customTransport.flush();

      expect(customTransport.flushCalls).toBe(1);
    });
  });

  describe('auto-flush behavior', () => {
    it('should auto-flush after default delay when autoFlush is true', async () => {
      const requestSpy = vi.fn();
      server.use(
        http.post(API_URL, async () => {
          requestSpy();
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({
        input: API_URL,
        autoFlush: true,
      });

      transport.log([createLogEvent()]);

      // Default delay is 2000ms
      await vi.advanceTimersByTimeAsync(2000);

      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it('should auto-flush after custom delay', async () => {
      const requestSpy = vi.fn();
      server.use(
        http.post(API_URL, async () => {
          requestSpy();
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({
        input: API_URL,
        autoFlush: { durationMs: 1000 },
      });

      transport.log([createLogEvent()]);

      await vi.advanceTimersByTimeAsync(999);
      expect(requestSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it('should not postpone auto-flush when new logs are added', async () => {
      let receivedBody: any;
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedBody = await request.json();
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({
        input: API_URL,
        autoFlush: { durationMs: 1000 },
      });

      transport.log([createLogEvent(LogLevel.info, 'first')]);

      await vi.advanceTimersByTimeAsync(500);
      transport.log([createLogEvent(LogLevel.info, 'second')]);

      await vi.advanceTimersByTimeAsync(500);
      expect(receivedBody).toBeDefined();
      expect(receivedBody[0].message).toBe('first');
      expect(receivedBody[1].message).toBe('second');
    });

    it('makes concurrent flush callers wait for their own snapshots', async () => {
      const receivedMessages: string[][] = [];
      let resolveFirstRequest: (() => void) | undefined;
      let resolveSecondRequest: (() => void) | undefined;
      let markFirstRequestStarted: (() => void) | undefined;
      let markSecondRequestStarted: (() => void) | undefined;
      const firstRequestStarted = new Promise<void>((resolve) => {
        markFirstRequestStarted = resolve;
      });
      const secondRequestStarted = new Promise<void>((resolve) => {
        markSecondRequestStarted = resolve;
      });
      const releaseFirstRequest = new Promise<void>((resolve) => {
        resolveFirstRequest = resolve;
      });
      const releaseSecondRequest = new Promise<void>((resolve) => {
        resolveSecondRequest = resolve;
      });

      server.use(
        http.post(API_URL, async ({ request }) => {
          const logs = (await request.json()) as Array<{ message: string }>;
          receivedMessages.push(logs.map((log) => log.message));

          if (receivedMessages.length === 1) {
            markFirstRequestStarted?.();
            await releaseFirstRequest;
          } else if (receivedMessages.length === 2) {
            markSecondRequestStarted?.();
            await releaseSecondRequest;
          }

          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
      transport.log([createLogEvent(LogLevel.info, 'first')]);
      const firstFlush = transport.flush();
      await firstRequestStarted;

      transport.log([createLogEvent(LogLevel.info, 'second')]);
      const secondFlush = transport.flush();
      const thirdFlush = transport.flush();
      const firstFlushResolved = vi.fn();
      const secondFlushResolved = vi.fn();
      const thirdFlushResolved = vi.fn();
      void firstFlush.then(firstFlushResolved);
      void secondFlush.then(secondFlushResolved);
      void thirdFlush.then(thirdFlushResolved);

      expect(receivedMessages).toEqual([['first']]);

      resolveFirstRequest?.();
      await secondRequestStarted;
      await Promise.resolve();

      expect(firstFlushResolved).toHaveBeenCalledOnce();
      expect(secondFlushResolved).not.toHaveBeenCalled();
      expect(thirdFlushResolved).not.toHaveBeenCalled();

      resolveSecondRequest?.();
      await Promise.all([firstFlush, secondFlush, thirdFlush]);

      expect(receivedMessages).toEqual([['first'], ['second']]);
      expect(firstFlushResolved).toHaveBeenCalledOnce();
      expect(secondFlushResolved).toHaveBeenCalledOnce();
      expect(thirdFlushResolved).toHaveBeenCalledOnce();
    });

    it('bounds the queue and request body', async () => {
      let receivedMessages: string[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          const logs = (await request.json()) as Array<{ message: string }>;
          receivedMessages = logs.map((log) => log.message);
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({ input: API_URL, autoFlush: false });
      transport.log(Array.from({ length: 1_001 }, (_, index) => createLogEvent(LogLevel.info, `event-${index}`)));

      await transport.flush();

      expect(receivedMessages).toHaveLength(1_000);
      expect(receivedMessages[0]).toBe('event-1');
      expect(receivedMessages.at(-1)).toBe('event-1000');
    });

    it('should auto-flush with custom duration from config object', async () => {
      const requestSpy = vi.fn();
      server.use(
        http.post(API_URL, async () => {
          requestSpy();
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({
        input: API_URL,
        autoFlush: { durationMs: 500 },
      });

      transport.log([createLogEvent()]);

      await vi.advanceTimersByTimeAsync(499);
      expect(requestSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom fetch configuration', () => {
    it('should respect custom fetch init options', async () => {
      let receivedHeaders: Headers = new Headers();
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({
        input: API_URL,
        init: {
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test',
          },
          credentials: 'include',
        },
      });

      transport.log([createLogEvent()]);
      await transport.flush();

      expect(receivedHeaders.get('X-Custom-Header')).toBe('test');
      expect(receivedHeaders.get('Content-Type')).toBe('application/json');
    });
  });

  describe('non-JSON-native payloads', () => {
    it('flushes the full batch when a log contains a circular reference', async () => {
      let receivedLogs: any[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedLogs = (await request.json()) as any[];
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({ input: API_URL });
      const circularFields: Record<string, unknown> = {};
      circularFields.self = circularFields;

      transport.log([
        createLogEvent(LogLevel.info, 'before'),
        createLogEvent(LogLevel.info, 'circular', circularFields),
        createLogEvent(LogLevel.info, 'after'),
      ]);
      await transport.flush();

      expect(receivedLogs.map((log) => log.message)).toEqual(['before', 'circular', 'after']);
      expect(receivedLogs[1].fields.self).toBe('[Circular]');
    });

    it('does not cause an unhandled rejection during auto-flush', async () => {
      const unhandledRejection = vi.fn();
      process.on('unhandledRejection', unhandledRejection);
      server.use(http.post(API_URL, () => HttpResponse.json({ success: true })));

      try {
        transport = new SimpleFetchTransport({ input: API_URL, autoFlush: { durationMs: 500 } });
        const circularFields: Record<string, unknown> = {};
        circularFields.self = circularFields;
        transport.log([createLogEvent(LogLevel.info, 'circular', circularFields)]);

        await vi.advanceTimersByTimeAsync(500);

        expect(unhandledRejection).not.toHaveBeenCalled();
      } finally {
        process.off('unhandledRejection', unhandledRejection);
      }
    });
  });

  describe('log level filtering', () => {
    it('should filter logs based on logLevel', async () => {
      let receivedLogs: any[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedLogs = (await request.json()) as any[];
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({
        input: API_URL,
        logLevel: LogLevel.warn,
      });

      transport.log([
        createLogEvent(LogLevel.debug, 'debug message'),
        createLogEvent(LogLevel.info, 'info message'),
        createLogEvent(LogLevel.warn, 'warn message'),
        createLogEvent(LogLevel.error, 'error message'),
      ]);

      await transport.flush();

      expect(receivedLogs).toHaveLength(2);
      expect(receivedLogs.map((log) => log.level)).toEqual(['warn', 'error']);
    });

    it('should use info as default logLevel', async () => {
      let receivedLogs: any[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedLogs = (await request.json()) as any[];
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({ input: API_URL });

      transport.log([
        createLogEvent(LogLevel.debug, 'debug message'),
        createLogEvent(LogLevel.info, 'info message'),
        createLogEvent(LogLevel.warn, 'warn message'),
      ]);

      await transport.flush();

      expect(receivedLogs).toHaveLength(2);
      expect(receivedLogs.map((log) => log.level)).toEqual(['info', 'warn']);
    });
  });
});
