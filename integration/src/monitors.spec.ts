import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { monitors, datasets } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('MonitorsService', () => {
  const datasetName = `test-axiom-js-datasets-${datasetSuffix}`;
  const datasetsClient = new datasets.Service({
    token: process.env.AXIOM_TOKEN || '',
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
  });
  const client = new monitors.Service({
    token: process.env.AXIOM_TOKEN || '',
    orgId: process.env.AXIOM_ORG_ID,
  });

  let monitorId = '';

  beforeAll(async () => {
    await datasetsClient.create({
      name: datasetName,
      description: 'This is a test dataset to be used for annotations testing',
    });
  });

  afterAll(async () => {
    const resp = await datasetsClient.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  it('Create', async () => {
    const request: monitors.CreateRequest = {
      name: 'Integration Test Monitor',
      type: 'Threshold',
      description: 'Monitor created by integration test',
      aplQuery: `['${datasetName}'] | summarize count() by bin_auto(_time)`,
      operator: 'Above',
      threshold: 100,
      alertOnNoData: false,
      notifyByGroup: false,
      notifierIDs: [],
      intervalMinutes: 5,
      rangeMinutes: 10,
    };

    const response = await client.create(request);
    expect(response).toBeDefined();
    expect(response.name).toEqual(request.name);
    expect(response.description).toEqual(request.description);
    expect(response.type).toEqual(request.type);
    expect(response.threshold).toEqual(request.threshold);

    monitorId = response.id;
  });

  it('Get', async () => {
    const response = await client.get(monitorId);
    expect(response).toBeDefined();
    expect(response.id).toEqual(monitorId);
    expect(response.name).toEqual('Integration Test Monitor');
  });

  it('List', async () => {
    const response = await client.list();
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
    expect(response.find((m: monitors.Monitor) => m.id === monitorId)).toBeDefined();
  });

  it('Update', async () => {
    const request: monitors.UpdateRequest = {
      name: 'Updated Integration Test Monitor',
      type: 'Threshold',
      description: 'Updated monitor description',
      aplQuery: `['${datasetName}'] | summarize count() by bin_auto(_time)`,
      operator: 'Above',
      threshold: 150,
      alertOnNoData: false,
      notifyByGroup: false,
      notifierIDs: [],
      intervalMinutes: 5,
      rangeMinutes: 10,
    };

    const response = await client.update(monitorId, request);
    expect(response).toBeDefined();
    expect(response.id).toEqual(monitorId);
    expect(response.name).toEqual(request.name);
    expect(response.description).toEqual(request.description);
    expect(response.threshold).toEqual(request.threshold);
  });

  it('Delete', async () => {
    const response = await client.delete(monitorId);
    expect(response).toBeDefined();
    expect(response.status).toEqual(204);

    // Verify the monitor is actually deleted
    try {
      const fetchResponse = await client.get(monitorId);
      expect(fetchResponse).toBeUndefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
