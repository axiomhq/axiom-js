import { describe, expect, it, vi } from 'vitest';
import { tokens } from '../../src/tokens';
import { testMockedFetchCall } from '../lib/mock';

const baseUrl = 'http://axiom-js.dev.local';

describe('TokensService', () => {
  const client = new tokens.Service({ url: baseUrl, token: 'test-token' });

  const token: tokens.Token = {
    id: 'token-id',
    name: 'Deploy token',
    datasetCapabilities: {},
    orgCapabilities: {},
  };

  it('lists API tokens', async () => {
    testMockedFetchCall(
      (url: string, init: RequestInit) => {
        expect(url).toEqual(`${baseUrl}/v2/tokens`);
        expect(init.method).toEqual('GET');
      },
      [token],
    );

    await expect(client.list()).resolves.toEqual([token]);
  });

  it('gets an API token and encodes its ID', async () => {
    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/tokens/token%2Fid`);
      expect(init.method).toEqual('GET');
    }, token);

    await expect(client.get('token/id')).resolves.toEqual(token);
  });

  it('creates an API token', async () => {
    const request: tokens.CreateRequest = {
      name: token.name,
      datasetCapabilities: {},
      orgCapabilities: {},
    };
    const response: tokens.CreateResponse = { ...token, token: 'xaat-secret' };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/tokens`);
      expect(init.method).toEqual('POST');
      expect(init.body).toEqual(JSON.stringify(request));
    }, response);

    await expect(client.create(request)).resolves.toEqual(response);
  });

  it('deletes an API token', async () => {
    vi.spyOn(global, 'fetch').mockImplementationOnce((url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toEqual(`${baseUrl}/v2/tokens/token%2Fid`);
      expect(init?.method).toEqual('DELETE');
      return Promise.resolve(new Response(null, { status: 204 }));
    });

    await expect(client.delete('token/id')).resolves.toBeUndefined();
  });

  it('regenerates an API token', async () => {
    const request: tokens.RegenerateRequest = {
      existingTokenExpiresAt: '2026-09-23T00:00:00Z',
    };
    const response: tokens.CreateResponse = { ...token, token: 'xaat-new-secret' };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/tokens/token-id/regenerate`);
      expect(init.method).toEqual('POST');
      expect(init.body).toEqual(JSON.stringify(request));
    }, response);

    await expect(client.regenerate('token-id', request)).resolves.toEqual(response);
  });
});
