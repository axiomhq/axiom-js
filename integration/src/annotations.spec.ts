import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { datasets, annotations } from '@axiomhq/js';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('AnnotationsService', () => {
  const datasetName = `test-axiom-js-datasets-${datasetSuffix}`;
  const datasetsClient = new datasets.Service({
    token: process.env.AXIOM_TOKEN || '',
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
  });
  const client = new annotations.Service({
    token: process.env.AXIOM_TOKEN || '',
    url: process.env.AXIOM_URL,
    orgId: process.env.AXIOM_ORG_ID,
  });
  let id: string = '';

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

  describe('create', () => {
    it('creates annotations successfully', async () => {
      const result = await client.create({
        type: 'test-deployment',
        datasets: [datasetName],
        title: 'test1',
        description: 'This is a test description',
        url: 'some-url',
      });

      expect(result).not.toEqual(null);
      expect(result.title).toEqual('test1');

      // set id
      id = result.id;
    });
  });

  describe('update', () => {
    it('should update the annotation', async () => {
      const dataset = await client.update(id, {
        type: 'test-deployment',
        datasets: [datasetName],
        title: 'test1',
        url: 'some-url',
        description: 'This is a soon to be filled test dataset',
      });

      expect(dataset.description).toEqual('This is a soon to be filled test dataset');
    });
  });

  describe('get', () => {
    it('should get the annotation', async () => {
      const annotation = await client.get(id);

      expect(annotation.title).toEqual('test1');
    });
  });

  describe('list', () => {
    it('should list the annotations', async () => {
      const annotations = await client.list();

      expect(annotations.length).toBeGreaterThan(0);
    });
  });
});
