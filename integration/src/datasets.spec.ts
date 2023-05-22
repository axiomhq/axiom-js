import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { datasets } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('DatasetsService', () => {
  const datasetName = `test-axiom-js-datasets-${datasetSuffix}`;
  const client = new datasets.Service();

  beforeAll(async () => {
    await client.create({
      name: datasetName,
      description: 'This is a test dataset for datasets integration tests.',
    });
  });

  afterAll(async () => {
    const resp = await client.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  describe('update', () => {
    it('should update the dataset', async () => {
      const dataset = await client.update(datasetName, {
        description: 'This is a soon to be filled test dataset',
      });

      expect(dataset.description).toEqual('This is a soon to be filled test dataset');
    });
  });

  describe('get', () => {
    it('should get the dataset', async () => {
      const dataset = await client.get(datasetName);

      expect(dataset.name).toEqual(datasetName);
    });
  });

  describe('list', () => {
    it('should list the datasets', async () => {
      const datasets = await client.list();

      expect(datasets.length).toBeGreaterThan(0);
    });
  });

  describe('trim', () => {
    it('returns a valid response', async () => {
      const result = await client.trim(datasetName, '1s');

      expect(result).not.toEqual(null);
    });
  });
});
