import { describe, afterEach, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AxiomProxyTransport } from '../../../src/transports/proxy-transport';
import { http, HttpResponse, HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { createLogEvent } from '../../lib/mock';

describe('AxiomProxyTransport', () => {
  const PROXY_URL = 'https://proxy.example.com/logs';

  const handlers: HttpHandler[] = [
    http.post(PROXY_URL, async ({ request }) => {
      return HttpResponse.json({ success: true });
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen());
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  describe('configuration', () => {
    it('should send logs to configured proxy URL', async () => {
      let receivedUrl = '';
      let receivedBody: any;

      server.use(
        http.post('*', async ({ request }) => {
          receivedUrl = request.url;
          receivedBody = await request.json();
          return HttpResponse.json({ success: true });
        }),
      );

      const transport = new AxiomProxyTransport({
        url: PROXY_URL,
      });

      const logEvent = createLogEvent();
      transport.log([logEvent]);
      await transport.flush();

      expect(receivedUrl).toBe(PROXY_URL);
      expect(receivedBody).toEqual([logEvent]);
    });

    it('should respect autoFlush configuration', async () => {
      let requestCount = 0;
      server.use(
        http.post('*', async () => {
          requestCount++;
          return HttpResponse.json({ success: true });
        }),
      );

      const transport = new AxiomProxyTransport({
        url: PROXY_URL,
        autoFlush: false,
      });

      transport.log([createLogEvent()]);
      expect(requestCount).toBe(0);

      await transport.flush();
      expect(requestCount).toBe(1);
    });

    it('should handle request errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(
        http.post(PROXY_URL, () => {
          return HttpResponse.error();
        }),
      );

      const transport = new AxiomProxyTransport({
        url: PROXY_URL,
      });

      transport.log([createLogEvent()]);
      await transport.flush();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
