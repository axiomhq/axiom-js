import { describe, expect, it } from 'vitest';

import { dashboards } from '../../src/dashboards';
import { testMockedFetchCall } from '../lib/mock';

const baseUrl = 'http://axiom-js.dev.local';

describe('DashboardsService', () => {
  const client = new dashboards.Service({ url: baseUrl, token: 'test-token' });

  it('lists dashboards with limit and offset query params', async () => {
    const response: dashboards.DashboardResource[] = [
      {
        id: 'dashboard-id',
        uid: 'dashboard-uid',
        dashboard: { name: 'Runtime overview' },
        version: 1,
      },
    ];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/dashboards?limit=100&offset=20`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.list({ limit: 100, offset: 20 })).resolves.toEqual(response);
  });

  it('gets a dashboard by encoded uid', async () => {
    const response: dashboards.DashboardResource = {
      id: 'dashboard-id',
      uid: 'folder/dashboard #1',
      dashboard: {
        name: 'Latency',
        charts: [{ name: 'p95' }],
      },
      createdAt: '2026-06-03T00:00:00Z',
      createdBy: 'user-id',
      updatedAt: '2026-06-03T00:00:00Z',
      updatedBy: 'user-id',
      version: 2,
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/dashboards/uid/folder%2Fdashboard%20%231`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.get(response.uid)).resolves.toEqual(response);
  });
});
