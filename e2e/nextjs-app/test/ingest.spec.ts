import { Axiom, datasets } from '@axiomhq/js';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const datasetDeletionTimeoutMs = 30_000;
const datasetDeletionPollIntervalMs = 250;

function isNotFoundError(error: unknown) {
  return error instanceof Error && /not found/i.test(error.message);
}

async function cleanupDatasetIfExists(client: datasets.Service, datasetName: string) {
  try {
    await client.delete(datasetName);
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }

    throw error;
  }

  const deadline = Date.now() + datasetDeletionTimeoutMs;
  while (true) {
    try {
      await client.get(datasetName);
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }

      throw error;
    }

    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for dataset ${datasetName} to be deleted`);
    }

    await new Promise(resolve => setTimeout(resolve, datasetDeletionPollIntervalMs));
  }
}

describe('Ingestion & query on different runtime', () => {
  vi.useRealTimers()

  const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL, orgId: process.env.AXIOM_ORG_ID });
  const datasetName = `axiom-js-e2e-test-${process.env.AXIOM_DATASET_SUFFIX || 'local'}`;

  beforeAll(async () => {
    await cleanupDatasetIfExists(axiom.datasets, datasetName);

    const ds = await axiom.datasets.create({
      name: datasetName,
      description: 'This is a test dataset for datasets integration tests.',
    });
    console.log(`creating datasets for testing: ${ds.name} (${ds.id})`);
  }, 60_000);

  afterAll(async () => {
    await cleanupDatasetIfExists(axiom.datasets, datasetName);
    console.log(`deleted testing dataset: ${datasetName}`);
  }, 60_000);

  it('ingest on a lambda function should succeed', async () => {
    const startTime = new Date(Date.now()).toISOString();
    // call route that ingests logs
    const resp = await fetch(`${process.env.TESTING_TARGET_URL}/api/lambda?dataset=${encodeURIComponent(datasetName)}`);
    expect(resp.status).toEqual(200);
    const payload = await resp.json();
    expect(payload.ingested).toEqual(2);

    // sleep 1 sec
    await new Promise(r => setTimeout(r, 1000));

    // check dataset for ingested logs
    const qResp = await axiom.query(
      `['${datasetName}'] | where ['test'] == "ingest_on_lambda" | project _time, test, foo, bar`,
      {
        startTime,
        format: 'tabular',
      },
    );
    expect(qResp.status).toBeDefined();
    expect(qResp.tables).toBeDefined();
    expect(qResp.tables).toHaveLength(1);
    expect(qResp.tables[0].columns).toHaveLength(4);
    expect(qResp.tables[0].columns?.[1][0]).toEqual('ingest_on_lambda');
    expect(qResp.tables[0].columns?.[2][0]).toEqual('bar');
    expect(qResp.tables[0].columns?.[3][1]).toEqual('baz');
  });

  it('ingest on a edge function should succeed', async () => {
    const startTime = new Date(Date.now()).toISOString();
    // call route that ingests logs
    const resp = await fetch(`${process.env.TESTING_TARGET_URL}/api/edge?dataset=${encodeURIComponent(datasetName)}`);
    expect(resp.status).toEqual(200);
    const payload = await resp.json();
    expect(payload.ingested).toEqual(2);

    // sleep 1 sec
    await new Promise(resolve => setTimeout(resolve, 1000));

    // check dataset for ingested logs
    const qResp = await axiom.query(
      `['${datasetName}'] | where ['test'] == "ingest_on_edge" | project _time, test, foo, bar`,
      {
        startTime,
        format: 'tabular',
      },
    );
    expect(qResp.status).toBeDefined();
    expect(qResp.tables).toBeDefined();
    expect(qResp.tables).toHaveLength(1);
    expect(qResp.tables[0].columns).toHaveLength(4);
    expect(qResp.tables[0].columns?.[2][0]).toEqual('bar');
    expect(qResp.tables[0].columns?.[3][1]).toEqual('baz');
  });
});
