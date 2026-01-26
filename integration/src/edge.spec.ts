import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AxiomWithoutBatching, Axiom } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

// Edge configuration
const edge = process.env.AXIOM_EDGE;
const edgeUrl = process.env.AXIOM_EDGE_URL;
const edgeToken = process.env.AXIOM_EDGE_TOKEN;
const edgeDatasetRegion = process.env.AXIOM_EDGE_DATASET_REGION;

// Main API token (for dataset management)
const mainToken = process.env.AXIOM_TOKEN || '';

// Skip if edge is not configured - need both edge endpoint AND edge token
const hasEdgeConfig = (edge || edgeUrl) && edgeToken;

describe.skipIf(!hasEdgeConfig)('Edge Ingestion', () => {
  const datasetName = `test-axiom-js-edge-${datasetSuffix}`;

  // Main client for dataset management (uses main token, no edge)
  const mainAxiom = new AxiomWithoutBatching({
    token: mainToken,
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
  });

  // Edge client for ingest/query (uses edge token)
  const edgeAxiom = new AxiomWithoutBatching({
    token: edgeToken!,
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
    edge: edge,
    edgeUrl: edgeUrl,
  });

  // Batch client with edge options
  const edgeAxiomBatch = new Axiom({
    token: edgeToken!,
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
    edge: edge,
    edgeUrl: edgeUrl,
  });

  beforeAll(async () => {
    // Create dataset (uses main token, optionally with region for edge)
    const createRequest: { name: string; description: string; region?: string } = {
      name: datasetName,
      description: 'Test dataset for edge ingestion integration tests.',
    };
    // Only set region if explicitly configured and non-empty
    if (edgeDatasetRegion && edgeDatasetRegion.trim() !== '') {
      createRequest.region = edgeDatasetRegion;
    }
    await mainAxiom.datasets.create(createRequest);
  });

  afterAll(async () => {
    // Delete dataset (uses main token)
    const resp = await mainAxiom.datasets.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  describe('ingest via edge', () => {
    it('works with single event', async () => {
      const status = await edgeAxiom.ingest(datasetName, { source: 'edge-test', value: 1 });
      expect(status.ingested).toEqual(1);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with multiple events', async () => {
      const status = await edgeAxiom.ingest(datasetName, [
        { source: 'edge-test', value: 2 },
        { source: 'edge-test', value: 3 },
      ]);
      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });
  });

  describe('batch ingest via edge', () => {
    it('works with batched events', async () => {
      edgeAxiomBatch.ingest(datasetName, { source: 'edge-batch-test', value: 4 });
      edgeAxiomBatch.ingest(datasetName, { source: 'edge-batch-test', value: 5 });
      await edgeAxiomBatch.flush();
    });
  });

  describe('query via edge', () => {
    it('returns ingested data', async () => {
      // Wait for ingestion to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await edgeAxiom.query(`['${datasetName}'] | where source == 'edge-test'`);

      expect(result.status.rowsMatched).toBeGreaterThanOrEqual(3);
    });
  });

  describe('main API still works with edge configured', () => {
    it('can list datasets via main API', async () => {
      const datasets = await mainAxiom.datasets.list();
      expect(datasets).toBeDefined();
      expect(Array.isArray(datasets)).toBe(true);
    });

    it('can get current user via main API', async () => {
      const user = await mainAxiom.users.current();
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    });
  });
});
