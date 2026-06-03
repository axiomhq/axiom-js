import { describe, expect, it } from 'vitest';

import { savedQueries } from '../../src/savedQueries';
import { testMockedFetchCall } from '../lib/mock';

const baseUrl = 'http://axiom-js.dev.local';

describe('SavedQueriesService', () => {
  const client = new savedQueries.Service({ url: baseUrl, token: 'test-token' });

  it('lists saved queries with limit and who query params', async () => {
    const response: savedQueries.SavedQuery[] = [
      {
        id: 'saved-query-id',
        kind: 'apl',
        metadata: {},
        name: 'Errors',
        query: { apl: "['logs'] | where level == 'error'" },
        who: 'user-id',
      },
    ];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/apl-starred-queries?limit=100&who=all`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.list({ limit: 100, who: 'all' })).resolves.toEqual(response);
  });

  it('gets a saved query by encoded id', async () => {
    const response: savedQueries.SavedQuery = {
      id: 'folder/query #1',
      kind: 'apl',
      metadata: { owner: 'runtime' },
      name: 'Latency',
      query: {
        apl: "['logs'] | summarize count()",
        endTime: '2026-06-03T10:31:37-04:00',
        startTime: '2026-06-02T10:31:37-04:00',
      },
      who: 'user-id',
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/apl-starred-queries/folder%2Fquery%20%231`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.get(response.id)).resolves.toEqual(response);
  });
});
