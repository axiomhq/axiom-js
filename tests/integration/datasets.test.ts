import { expect } from 'chai';

import { datasets } from '../../lib/datasets';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('DatasetsService', () => {
    const datasetName = `test-axiom-node-dataset-${datasetSuffix}`;
    const client = new datasets.Service();

    before(async () => {
        await client.create({
            name: datasetName,
            description: 'This is a test dataset for datasets integration tests.',
        });
    });

    after(async () => {
        const resp = await client.delete(datasetName);
        expect(resp.status).to.equal(204);
    });

    describe('update', () => {
        it('should update the dataset', async () => {
            const dataset = await client.update(datasetName, {
                description: 'This is a soon to be filled test dataset',
            });

            expect(dataset.description).to.equal('This is a soon to be filled test dataset');
        });
    });

    describe('get', () => {
        it('should get the dataset', async () => {
            const dataset = await client.get(datasetName);

            expect(dataset.name).to.equal(datasetName);
        });
    });

    describe('list', () => {
        it('should list the datasets', async () => {
            const datasets = await client.list();

            expect(datasets.length).to.be.greaterThan(0);
        });
    });

    describe('trim', () => {
        it('returns a valid response', async () => {
            const result = await client.trim(datasetName, '1s');

            expect(result).to.not.equal(null);
        });
    });
});
