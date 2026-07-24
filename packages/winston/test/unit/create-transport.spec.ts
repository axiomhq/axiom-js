import { describe, it, expect, vi } from 'vitest';
import { WinstonTransport } from '../../src';

describe('winston transport tests', () => {
  it('creates a truthy instance', () => {
    const t = new WinstonTransport({ token: process.env.AXIOM_TOKEN || '' });
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });

  it('uses a custom fetch implementation', async () => {
    const customFetch = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify({ ingested: 1, failed: 0 }));
    });
    const transport = new WinstonTransport({
      token: 'test-token',
      dataset: 'test-dataset',
      fetch: customFetch,
    });

    await transport.client.ingest('test-dataset', { message: 'test' });

    expect(customFetch).toHaveBeenCalledOnce();
  });
});
