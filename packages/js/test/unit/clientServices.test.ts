import { describe, expect, it } from 'vitest';

import { AxiomWithoutBatching } from '../../src/client';
import { annotations } from '../../src/annotations';
import { monitors } from '../../src/monitors';
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
      emails: ['user@example.com'],
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${clientURL}/v1/user`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.users.current()).resolves.toEqual(response);
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
