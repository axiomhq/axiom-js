import { describe, it, expect, vi } from 'vitest';
import axiomTransport from '../../src';

describe('pino transport tests', () => {
  it('creates a truthy instance', () => {
    const t = axiomTransport({ token: process.env.AXIOM_TOKEN || '', dataset: process.env.AXIOM_DATASET || '' });
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });

  it('uses a custom fetch implementation', async () => {
    const customFetch = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify({ ingested: 1, failed: 0 }));
    });
    const transport = await axiomTransport({
      token: 'test-token',
      dataset: 'test-dataset',
      fetch: customFetch,
    });

    transport.end(`${JSON.stringify({ time: Date.now(), level: 30, message: 'test' })}\n`);
    await new Promise<void>((resolve, reject) => {
      transport.on('close', resolve);
      transport.on('error', reject);
    });

    expect(customFetch).toHaveBeenCalledOnce();
  });
});
