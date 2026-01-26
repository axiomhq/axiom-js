import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AxiomWithoutBatching, Axiom } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';
const edge = process.env.AXIOM_EDGE;
const edgeUrl = process.env.AXIOM_EDGE_URL;

// Skip if neither edge nor edgeUrl is configured
const hasEdgeConfig = edge || edgeUrl;

describe.skipIf(!hasEdgeConfig)('Edge Ingestion', () => {
  const datasetName = `test-axiom-js-edge-${datasetSuffix}`;
  
  // Client with both url (for API) and edge options (for ingest/query)
  const axiom = new AxiomWithoutBatching({
    token: process.env.AXIOM_TOKEN || '',
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
    edge: edge,
    edgeUrl: edgeUrl,
  });

  // Batch client with edge options
  const axiomBatch = new Axiom({
    token: process.env.AXIOM_TOKEN || '',
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
    edge: edge,
    edgeUrl: edgeUrl,
  });

  beforeAll(async () => {
    await axiom.datasets.create({
      name: datasetName,
      description: 'Test dataset for edge ingestion integration tests.',
    });
  });

  afterAll(async () => {
    const resp = await axiom.datasets.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  describe('ingest via edge', () => {
    it('works with single event', async () => {
      const status = await axiom.ingest(datasetName, { source: 'edge-test', value: 1 });
      expect(status.ingested).toEqual(1);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with multiple events', async () => {
      const status = await axiom.ingest(datasetName, [
        { source: 'edge-test', value: 2 },
        { source: 'edge-test', value: 3 },
      ]);
      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });
  });

  describe('batch ingest via edge', () => {
    it('works with batched events', async () => {
      axiomBatch.ingest(datasetName, { source: 'edge-batch-test', value: 4 });
      axiomBatch.ingest(datasetName, { source: 'edge-batch-test', value: 5 });
      await axiomBatch.flush();
    });
  });

  describe('query via edge', () => {
    it('returns ingested data', async () => {
      // Wait for ingestion to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await axiom.query(`['${datasetName}'] | where source == 'edge-test'`);
      
      expect(result.status.rowsMatched).toBeGreaterThanOrEqual(3);
    });
  });
});
