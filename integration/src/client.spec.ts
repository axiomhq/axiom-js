import { gzip } from 'zlib';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AxiomWithoutBatching, ContentType, ContentEncoding } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('Axiom', () => {
  const datasetName = `test-axiom-js-client-${datasetSuffix}`;
  const axiom = new AxiomWithoutBatching({
    token: process.env.AXIOM_TOKEN || '',
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
  });

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

  describe('apl tabular query', () => {
    it('returns a valid response', async () => {
      const status = await axiom.ingest(datasetName, { test: 'apl' });
      expect(status.ingested).toEqual(1);

      // wait 1 sec for ingestion to finish
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await axiom.query("['" + datasetName + "'] | where ['test'] == 'apl' | project _time, ['test']", {
        format: 'tabular',
      });
      expect(result.status.rowsMatched).toEqual(1);
      expect(result.tables?.length).toEqual(1);
      expect(result.tables[0].columns?.length).toEqual(2); // _time and test
      expect(result.tables[0].columns?.[0]).toBeDefined();
      expect(result.tables[0].columns?.[1]).toBeDefined();
      expect(result.tables[0].columns?.[1].length).toEqual(1); // only one row
      expect(Array.from(result.tables[0].events()).length).toEqual(result.tables[0].columns?.[0].length);
      expect(Object.keys(Array.from(result.tables[0].events())[0])).toEqual(result.tables[0].fields.map((f) => f.name));
      expect(Object.values(Array.from(result.tables[0].events())[0][result.tables[0].fields[0].name])).toEqual(
        result.tables[0].columns?.[0][0],
      );
    });
  });
});
