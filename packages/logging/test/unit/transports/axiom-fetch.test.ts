import { describe, afterEach, it, expect, beforeAll, afterAll } from 'vitest';
import { AxiomFetchTransport } from '../../../src/transports/axiom-fetch';
import { http, HttpResponse, HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { createLogEvent } from '../../lib/mock';

describe('AxiomFetchTransport', () => {
  const DATASET = 'test-dataset';
  const TOKEN = 'test-token';
  const DEFAULT_URL = 'https://api.axiom.co';
  const CUSTOM_URL = 'https://custom.axiom.co';

  const handlers: HttpHandler[] = [
    http.post(`${DEFAULT_URL}/v1/datasets/${DATASET}/ingest`, async ({ request }) => {
      return HttpResponse.json({ success: true });
    }),
    http.post(`${CUSTOM_URL}/v1/datasets/${DATASET}/ingest`, async ({ request }) => {
      return HttpResponse.json({ success: true });
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen());
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  describe('configuration', () => {
    it('should use default URL when no custom URL provided', async () => {
      let receivedUrl = '';
      server.use(
        http.post('*', async ({ request }) => {
          receivedUrl = request.url;
          return HttpResponse.json({ success: true });
        }),
      );

      const transport = new AxiomFetchTransport({
        dataset: DATASET,
        token: TOKEN,
      });

      transport.log([createLogEvent()]);
      await transport.flush();

      expect(receivedUrl).toBe(`${DEFAULT_URL}/v1/datasets/${DATASET}/ingest`);
    });

    it('should use custom URL when provided', async () => {
      let receivedUrl = '';
      server.use(
        http.post('*', async ({ request }) => {
          receivedUrl = request.url;
          return HttpResponse.json({ success: true });
        }),
      );

      const transport = new AxiomFetchTransport({
        dataset: DATASET,
        token: TOKEN,
        url: CUSTOM_URL,
      });

      transport.log([createLogEvent()]);
      await transport.flush();

      expect(receivedUrl).toBe(`${CUSTOM_URL}/v1/datasets/${DATASET}/ingest`);
    });

    it('should set correct authorization header', async () => {
      let receivedHeaders: Headers = new Headers();
      server.use(
        http.post('*', async ({ request }) => {
          receivedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        }),
      );

      const transport = new AxiomFetchTransport({
        dataset: DATASET,
        token: TOKEN,
      });

      transport.log([createLogEvent()]);
      await transport.flush();

      expect(receivedHeaders.get('Authorization')).toBe(`Bearer ${TOKEN}`);
      expect(receivedHeaders.get('Content-Type')).toBe('application/json');
    });

    it('should respect autoFlush configuration', async () => {
      let requestCount = 0;
      server.use(
        http.post('*', async () => {
          requestCount++;
          return HttpResponse.json({ success: true });
        }),
      );

      const transport = new AxiomFetchTransport({
        dataset: DATASET,
        token: TOKEN,
        autoFlush: false,
      });

      transport.log([createLogEvent()]);
      expect(requestCount).toBe(0);

      await transport.flush();
      expect(requestCount).toBe(1);
    });
  });
});
