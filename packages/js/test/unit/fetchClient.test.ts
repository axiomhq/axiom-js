import { describe, expect, it, vi } from 'vitest';

import { FetchClient } from '../../src/fetchClient';

function createClient(response: () => Response): FetchClient {
  return new FetchClient({
    baseUrl: 'https://api.example.com',
    headers: {},
    timeout: 1000,
    fetch: vi.fn(async () => response()),
  });
}

describe('FetchClient error responses', () => {
  it('uses the message from a JSON error response', async () => {
    const client = createClient(() => Response.json({ message: 'invalid request' }, { status: 400 }));

    await expect(client.get('/datasets')).rejects.toThrow('invalid request');
  });

  it('uses a non-JSON error response as the error message', async () => {
    const client = createClient(() => new Response('upstream unavailable', { status: 502 }));

    await expect(client.get('/datasets')).rejects.toThrow('upstream unavailable');
  });

  it('provides a status-aware message for an empty error response', async () => {
    const client = createClient(() => new Response(null, { status: 400 }));

    await expect(client.get('/datasets')).rejects.toThrow('Unknown 400 error');
  });
});
