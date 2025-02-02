import { describe, expect, it } from 'vitest';
import { monitors } from '../../src/monitors';
import { mockFetchResponse, mockNoContentResponse } from '../lib/mock';

const monitorsList: monitors.Monitor[] = [
  {
    id: 'test1',
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user1',
    name: 'High CPU Usage',
    type: 'Threshold',
    description: 'Monitor for high CPU usage',
    aplQuery: "['system-metrics'] | where cpu > 90 | summarize count() by bin_auto(_time)",
    operator: 'Above',
    threshold: 10,
    alertOnNoData: true,
    notifyByGroup: false,
    notifierIDs: ['notifier1'],
    intervalMinutes: 5,
    rangeMinutes: 10,
    disabled: false,
  },
  {
    id: 'test2',
    createdAt: '2025-01-02T00:00:00Z',
    createdBy: 'user1',
    name: 'Error Rate Alert',
    type: 'MatchEvent',
    description: 'Monitor for error rate spikes',
    aplQuery: "['app-logs'] | where level = 'error'",
    operator: 'Above',
    threshold: 100,
    alertOnNoData: false,
    notifyByGroup: true,
    resolvable: true,
    notifierIDs: ['notifier1', 'notifier2'],
    intervalMinutes: 15,
    rangeMinutes: 30,
    disabled: false,
  },
];

describe('MonitorsService', () => {
  const client = new monitors.Service({ url: 'http://axiom-js.dev.local', token: '' });

  it('List', async () => {
    mockFetchResponse(monitorsList);
    const response = await client.list();
    expect(response).not.toEqual('undefined');
    expect(response).toHaveLength(2);
  });

  it('Get', async () => {
    mockFetchResponse(monitorsList[0]);
    const response = await client.get('test1');
    expect(response).toBeDefined();
    expect(response.id).toEqual('test1');
    expect(response.name).toEqual('High CPU Usage');
    expect(response.type).toEqual('Threshold');
  });

  it('Create', async () => {
    const request: monitors.CreateRequest = {
      name: 'Memory Usage Alert',
      type: 'Threshold',
      description: 'Monitor for memory usage',
      aplQuery: "['system-metrics'] | where memory > 80",
      operator: 'Above',
      threshold: 80,
      alertOnNoData: true,
      notifyByGroup: false,
      notifierIDs: ['notifier1'],
      intervalMinutes: 5,
      rangeMinutes: 10,
    };

    const expectedResponse = {
      id: 'test3',
      createdAt: '2025-01-03T00:00:00Z',
      createdBy: 'user1',
      ...request,
    };

    mockFetchResponse(expectedResponse);

    const response = await client.create(request);
    expect(response).toBeDefined();
    expect(response.id).toEqual('test3');
    expect(response.name).toEqual('Memory Usage Alert');
    expect(response.threshold).toEqual(80);
  });

  it('Update', async () => {
    const req: monitors.UpdateRequest = {
      name: 'Updated CPU Monitor',
      description: 'Updated description',
      threshold: 95,
    };

    const expectedResponse = {
      ...monitorsList[0],
      name: 'Updated CPU Monitor',
      description: 'Updated description',
      threshold: 95,
    };

    mockFetchResponse(expectedResponse);

    const response = await client.update('test1', req);
    expect(response).toBeDefined();
    expect(response.id).toEqual('test1');
    expect(response.name).toEqual('Updated CPU Monitor');
    expect(response.threshold).toEqual(95);
  });

  it('Delete', async () => {
    mockNoContentResponse();

    const response = await client.delete('test1');
    expect(response).toBeDefined();
    expect(response.status).toEqual(204);
  });
});
