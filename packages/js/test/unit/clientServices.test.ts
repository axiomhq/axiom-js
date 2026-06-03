import { describe, expect, it } from 'vitest';

import { AxiomWithoutBatching } from '../../src/client';
import { annotations } from '../../src/annotations';
import { dashboards } from '../../src/dashboards';
import { monitors } from '../../src/monitors';
import { savedQueries } from '../../src/savedQueries';
import { users } from '../../src/users';
import { testMockedFetchCall } from '../lib/mock';

const clientURL = 'http://axiom-js-services.dev.local';

describe('AxiomWithoutBatching mounted services', () => {
  it('creates annotations through the mounted annotations service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const request: annotations.CreateRequest = {
      datasets: ['logs'],
      type: 'symphony-agent',
    };
    const response: annotations.Annotation = {
      id: 'annotation-id',
      datasets: request.datasets,
      time: '2026-06-02T00:00:00Z',
      type: request.type,
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/annotations`);
      expect(init.method).toEqual('POST');
      expect(init.body).toEqual(JSON.stringify(request));
    }, response);

    await expect(client.annotations.create(request)).resolves.toEqual(response);
  });

  it('lists monitors through the mounted monitors service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const response: monitors.Monitor[] = [
      {
        id: 'monitor-id',
        createdAt: '2026-06-02T00:00:00Z',
        createdBy: 'user-id',
        name: 'Metric anomaly',
        type: 'AnomalyDetection',
        mplQuery: 'metrics:http_requests_total',
        notifierIds: ['notifier-id'],
      },
    ];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/monitors`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.monitors.list()).resolves.toEqual(response);
  });

  it('gets monitors through the mounted monitors service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const response: monitors.Monitor = {
      id: 'monitor-id',
      createdAt: '2026-06-02T00:00:00Z',
      createdBy: 'user-id',
      name: 'Error rate',
      type: 'Threshold',
      aplQuery: "['logs'] | where level == 'error'",
      operator: 'Above',
      notifierIDs: ['legacy-notifier-id'],
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/monitors/monitor-id`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.monitors.get('monitor-id')).resolves.toEqual(response);
  });

  it('gets the current user through the mounted users service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const response: users.User = {
      id: 'user-id',
      name: 'Axiom User',
      email: 'user@example.com',
      role: { id: 'admin', name: 'Admin' },
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/user`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.users.current()).resolves.toEqual(response);
  });

  it('lists and gets users through the mounted users service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const response: users.User[] = [
      {
        id: 'user-id',
        name: 'Axiom User',
        email: 'user@example.com',
        role: { id: 'admin', name: 'Admin' },
      },
    ];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/users`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.users.list()).resolves.toEqual(response);

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/users/user-id`);
      expect(init.method).toEqual('GET');
    }, response[0]);

    await expect(client.users.get('user-id')).resolves.toEqual(response[0]);
  });

  it('lists dashboards through the mounted dashboards service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const response: dashboards.DashboardResource[] = [
      {
        id: 'dashboard-id',
        uid: 'dashboard-uid',
        dashboard: { name: 'Runtime overview' },
      },
    ];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/dashboards?limit=100&offset=20`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.dashboards.list({ limit: 100, offset: 20 })).resolves.toEqual(response);
  });

  it('lists saved queries through the mounted savedQueries service', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const response: savedQueries.SavedQuery[] = [
      {
        id: 'saved-query-id',
        kind: 'apl',
        metadata: {},
        name: 'Recent errors',
        query: { apl: "['logs'] | where level == 'error'" },
        who: 'user-id',
      },
    ];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v2/apl-starred-queries?limit=100&who=all`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.savedQueries.list({ limit: 100, who: 'all' })).resolves.toEqual(response);
  });

  it('creates monitor payloads with notifierIds', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const request: monitors.CreateRequest = {
      name: 'Metric anomaly',
      type: 'AnomalyDetection',
      mplQuery: 'metrics:http_requests_total',
      notifierIds: ['notifier-id'],
    };

    testMockedFetchCall(
      (url: string, init: RequestInit) => {
        expect(url).toEqual(`${clientURL}/v2/monitors`);
        expect(init.method).toEqual('POST');
        expect(init.body).toEqual(JSON.stringify(request));
      },
      { id: 'monitor-id', createdAt: '2026-06-02T00:00:00Z', createdBy: 'user-id', ...request },
    );

    await client.monitors.create(request);
  });

  it('creates monitor payloads with legacy notifierIDs', async () => {
    const client = new AxiomWithoutBatching({ url: clientURL, token: 'test-token' });
    const request: monitors.CreateRequest = {
      name: 'Error rate',
      type: 'Threshold',
      aplQuery: "['logs'] | where level == 'error'",
      notifierIDs: ['legacy-notifier-id'],
    };

    testMockedFetchCall(
      (url: string, init: RequestInit) => {
        expect(url).toEqual(`${clientURL}/v2/monitors`);
        expect(init.method).toEqual('POST');
        expect(init.body).toEqual(JSON.stringify(request));
      },
      { id: 'monitor-id', createdAt: '2026-06-02T00:00:00Z', createdBy: 'user-id', ...request },
    );

    await client.monitors.create(request);
  });
});
