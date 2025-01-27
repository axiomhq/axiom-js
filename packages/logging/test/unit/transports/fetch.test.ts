import { describe, beforeEach, afterEach, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { SimpleFetchTransport } from '../../../src/transports/fetch';
import { LogEvent } from '../../../src';
import { http, HttpResponse, HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { createLogEvent } from '../../lib/mock';

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
        autoFlush: 1000,
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
        autoFlush: 1000,
      });

      transport.log([createLogEvent('info', 'first')]);

      await vi.advanceTimersByTimeAsync(500);
      transport.log([createLogEvent('info', 'second')]);

      await vi.advanceTimersByTimeAsync(500);
      expect(receivedBody).toBeUndefined();

      await vi.advanceTimersByTimeAsync(500);
      expect(receivedBody).toBeDefined();
      expect(receivedBody[0].message).toBe('first');
      expect(receivedBody[1].message).toBe('second');
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

      console.log(receivedHeaders);

      expect(receivedHeaders.get('X-Custom-Header')).toBe('test');
      expect(receivedHeaders.get('Content-Type')).toBe('application/json');
    });
  });
});
