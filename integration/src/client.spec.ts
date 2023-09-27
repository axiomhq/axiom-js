import { gzip } from 'zlib';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AxiomWithoutBatching, ContentType, ContentEncoding } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('Axiom', () => {
  const datasetName = `test-axiom-js-client-${datasetSuffix}`;
  const axiom = new AxiomWithoutBatching({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL, orgId: process.env.AXIOM_ORG_ID });

  beforeAll(async () => {
    await axiom.datasets.create({
      name: datasetName,
      description: 'This is a test dataset for datasets integration tests.',
    });
  });

  afterAll(async () => {
    const resp = await axiom.datasets.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  describe('ingest', () => {
    it('works with a JSON payload', async () => {
      const status = await axiom.ingestRaw(
        datasetName,
        `[{"foo":"bar"},{"bar":"baz"}]`,
        ContentType.JSON,
        ContentEncoding.Identity,
      );

      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with a NDJSON payload', async () => {
      const status = await axiom.ingestRaw(
        datasetName,
        `{"foo":"bar"}
{"bar":"baz"}`,
        ContentType.NDJSON,
        ContentEncoding.Identity,
      );

      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with a CSV payload', async () => {
      const status = await axiom.ingestRaw(
        datasetName,
        `foo
bar
baz`,
        ContentType.CSV,
        ContentEncoding.Identity,
      );

      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with gzip', async () => {
      const encoded: Buffer = await new Promise((resolve, reject) => {
        gzip(`[{"foo":"bar"},{"bar":"baz"}]`, (err: Error | null, content: Buffer) => {
          if (err) reject(err);
          else resolve(content);
        });
      });

      const status = await axiom.ingestRaw(datasetName, encoded, ContentType.JSON, ContentEncoding.GZIP);

      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with single event', async () => {
      const status = await axiom.ingest(datasetName, { foo: 'bar' });
      expect(status.ingested).toEqual(1);
      expect(status.failures?.length).toEqual(0);
    });

    it('works with two events', async () => {
      const status = await axiom.ingest(datasetName, [{ foo: 'bar' }, { bar: 'baz' }]);
      expect(status.ingested).toEqual(2);
      expect(status.failures?.length).toEqual(0);
    });
  });

  describe('query', () => {
    it('returns a valid response', async () => {
      const result = await axiom.queryLegacy(datasetName, {
        startTime: '2018-01-01T00:00:00.000Z',
        endTime: '2028-01-01T00:00:00.000Z',
        resolution: 'auto',
      });

      // expect(result.status.blocksExamined).toEqual(1);
      expect(result.status.rowsExamined).toEqual(11);
      expect(result.status.rowsMatched).toEqual(11);
      expect(result.matches?.length).toEqual(11);
    });
  });

  describe('apl query', () => {
    it('returns a valid response', async () => {
      const result = await axiom.query("['" + datasetName + "']");

      // expect(result.status.blocksExamined).toEqual(1);
      expect(result.status.rowsExamined).toEqual(11);
      expect(result.status.rowsMatched).toEqual(11);
      expect(result.matches?.length).toEqual(11);
    });
  });
});
