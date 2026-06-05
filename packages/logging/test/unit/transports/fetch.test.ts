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

    it('should handle request errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(
        http.post(API_URL, () => {
          return HttpResponse.error();
        }),
      );

      transport.log([createLogEvent()]);
      await transport.flush();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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

    it('should reset auto-flush timer when new logs are added', async () => {
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
      expect(receivedBody).toBeUndefined();

      await vi.advanceTimersByTimeAsync(500);
      expect(receivedBody).toBeDefined();
      expect(receivedBody[0].message).toBe('first');
      expect(receivedBody[1].message).toBe('second');
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

  describe('poisoned payloads', () => {
    it('does not drop the whole batch when one event contains a circular reference', async () => {
      let receivedLogs: any[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedLogs = (await request.json()) as any[];
          return HttpResponse.json({ success: true });
        }),
      );

      transport = new SimpleFetchTransport({ input: API_URL });

      const poisoned: any = createLogEvent(LogLevel.info, 'poisoned');
      poisoned.fields = { self: null as any };
      poisoned.fields.self = poisoned.fields;

      transport.log([createLogEvent(LogLevel.info, 'clean-1'), poisoned, createLogEvent(LogLevel.info, 'clean-2')]);
      await transport.flush();

      expect(receivedLogs).toHaveLength(3);
      expect(receivedLogs.map((l) => l.message)).toEqual(['clean-1', 'poisoned', 'clean-2']);
      expect(receivedLogs[1].fields.self).toBe('[Circular]');
    });

    it('does not reject when flush body serialization hits a DOM-like node', async () => {
      let receivedLogs: any[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          receivedLogs = (await request.json()) as any[];
          return HttpResponse.json({ success: true });
        }),
      );

      const prevWindow = (globalThis as any).window;
      const prevElement = (globalThis as any).Element;
      class FakeElement {
        tagName = 'IMG';
      }
      (globalThis as any).window = {};
      (globalThis as any).Element = FakeElement;

      try {
        transport = new SimpleFetchTransport({ input: API_URL });
        const ev: any = createLogEvent(LogLevel.info, 'with-dom');
        ev.fields = { webVital: { element: new FakeElement() } };
        transport.log([ev]);
        await transport.flush();
        expect(receivedLogs).toHaveLength(1);
        expect(receivedLogs[0].fields.webVital.element).toBe('[Element IMG]');
      } finally {
        (globalThis as any).window = prevWindow;
        (globalThis as any).Element = prevElement;
      }
    });

    it('requeues the batch when the server rejects the request', async () => {
      let attempts = 0;
      const bodies: any[] = [];
      server.use(
        http.post(API_URL, async ({ request }) => {
          attempts++;
          bodies.push(await request.json());
          if (attempts === 1) return HttpResponse.error();
          return HttpResponse.json({ success: true });
        }),
      );
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transport = new SimpleFetchTransport({ input: API_URL });
      transport.log([createLogEvent(LogLevel.info, 'retry-me')]);
      await transport.flush();
      await transport.flush();

      expect(attempts).toBe(2);
      expect(bodies[1][0].message).toBe('retry-me');
      consoleErrorSpy.mockRestore();
    });

    it('auto-flush timer does not reject when payload is circular', async () => {
      const unhandled = vi.fn();
      process.on('unhandledRejection', unhandled);

      server.use(http.post(API_URL, () => HttpResponse.json({ success: true })));

      transport = new SimpleFetchTransport({ input: API_URL, autoFlush: { durationMs: 500 } });
      const poisoned: any = createLogEvent(LogLevel.info, 'poisoned');
      poisoned.fields = { self: null as any };
      poisoned.fields.self = poisoned.fields;
      transport.log([poisoned]);

      await vi.advanceTimersByTimeAsync(500);
      await vi.runAllTimersAsync();

      expect(unhandled).not.toHaveBeenCalled();
      process.off('unhandledRejection', unhandled);
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
