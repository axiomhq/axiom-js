import { Axiom } from '@axiomhq/js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Ingestion & query on different runtime', () => {
  const axiom = new Axiom();

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
    console.log(`removed testing dataset: ${datasetName}`);
  });

  it('ingest on a lambda function should succeed', async () => {
    const startTime = new Date(Date.now()).toISOString();
    // call route that ingests logs
    const resp = await fetch(process.env.TESTING_TARGET_URL + '/api/lambda');
    expect(resp.status).toEqual(200);

    // check dataset for ingested logs
    const qResp = await axiom.query(`['${datasetName}'] | where ['test'] == "ingest_on_lambda"`, {
      startTime,
    });
    expect(qResp.matches).toBeDefined();
    expect(qResp.matches).toHaveLength(2);
    expect(qResp.matches![0].data.foo).toEqual('bar');
    expect(qResp.matches![1].data.bar).toEqual('baz');
  });

  it('ingest on a edge function should succeed', async () => {
    const startTime = new Date(Date.now()).toISOString();
    // call route that ingests logs
    const resp = await fetch(process.env.TESTING_TARGET_URL + '/api/edge');
    expect(resp.status).toEqual(200);

    // check dataset for ingested logs
    const qResp = await axiom.query(`['${datasetName}'] | where ['test'] == "ingest_on_edge"`, {
      startTime,
    });
    expect(qResp.matches).toBeDefined();
    expect(qResp.matches).toHaveLength(2);
    expect(qResp.matches![0].data.foo).toEqual('bar');
    expect(qResp.matches![1].data.bar).toEqual('baz');
  });

  // TODO: enable this test again when env vars are available on browser runtime
  // it('ingest on a browser runtime should succeed', async () => {
  //   const startTime = new Date(Date.now()).toISOString();
  //   // call route that ingests logs
  //   const resp = await fetch(process.env.TESTING_TARGET_URL + '/ingest');
  //   expect(resp.status).toEqual(200);

  //   // check dataset for ingested logs
  //   const qResp = await axiom.query(`['${datasetName}'] | where ['test'] == "ingest_on_browser"`, {
  //     startTime,
  //   });
  //   expect(qResp.matches).toBeDefined();
  //   expect(qResp.matches).toHaveLength(2);
  //   expect(qResp.matches![0].data.foo).toEqual('bar');
  //   expect(qResp.matches![1].data.bar).toEqual('baz');
  // });
});
