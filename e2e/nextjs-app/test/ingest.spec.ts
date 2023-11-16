import { Axiom } from '@axiomhq/js';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

describe('Ingestion & query on different runtime', () => {
  vi.useRealTimers()

  const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL, orgId: process.env.AXIOM_ORG_ID });
  const datasetName = 'axiom-js-e2e-test';

  beforeAll(async () => {
    const ds = await axiom.datasets.create({
      name: datasetName,
      description: 'This is a test dataset for datasets integration tests.',
    });
    console.log(`creating datasets for testing: ${ds.name} (${ds.id})`);
  });

  afterAll(async () => {
    const resp = await axiom.datasets.delete(datasetName);
    expect(resp.status).toEqual(204);
    console.log(`deleted testing dataset: ${datasetName}`);
  });

  it('ingest on a lambda function should succeed', async () => {
    const startTime = new Date(Date.now()).toISOString();
    // call route that ingests logs
    const resp = await fetch(process.env.TESTING_TARGET_URL + '/api/lambda');
    expect(resp.status).toEqual(200);
    const payload = await resp.json();
    expect(payload.ingested).toEqual(2);

    // sleep 1 sec
    await new Promise(r => setTimeout(r, 1000));

    // check dataset for ingested logs
    const qResp = await axiom.query(`['${datasetName}'] | where ['test'] == "ingest_on_lambda"`, {
      startTime,
    });
    expect(qResp.status).toBeDefined();
    expect(qResp.tables).toBeDefined();
    expect(qResp.tables).toHaveLength(1);
    expect(qResp.tables[0].columns).toHaveLength(2);
    expect(qResp.tables[0].columns[0].data.foo).toEqual('bar');
    expect(qResp.tables[0].columns[1].data.bar).toEqual('baz');
  });

  it('ingest on a edge function should succeed', async () => {
    const startTime = new Date(Date.now()).toISOString();
    // call route that ingests logs
    const resp = await fetch(process.env.TESTING_TARGET_URL + '/api/edge');
    expect(resp.status).toEqual(200);
    const payload = await resp.json();
    expect(payload.ingested).toEqual(2);

    // sleep 1 sec
    await new Promise(resolve => setTimeout(resolve, 1000));

    // check dataset for ingested logs
    const qResp = await axiom.query(`['${datasetName}'] | where ['test'] == "ingest_on_edge"`, {
      startTime,
    });
    expect(qResp.status).toBeDefined();
    expect(qResp.tables).toBeDefined();
    expect(qResp.tables).toHaveLength(1);
    expect(qResp.tables[0].columns).toHaveLength(2);
    expect(qResp.tables[0].columns[0].data.foo).toEqual('bar');
    expect(qResp.tables[0].columns[1].data.bar).toEqual('baz');
  });
});
