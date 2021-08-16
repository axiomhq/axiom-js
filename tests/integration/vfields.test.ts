/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import DatasetsService, { Dataset } from '../../lib/datasets';
import VirtualFieldsService, { VirtualField } from '../../lib/vfields';

const deploymentURL = process.env.AXIOM_URL || '';
const accessToken = process.env.AXIOM_TOKEN || '';
const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('VirtualFieldsService', () => {
    const datasetName = `test-axiom-node-monitors-${datasetSuffix}`;
    const datasetsClient = new DatasetsService(deploymentURL, accessToken);
    const client = new VirtualFieldsService(deploymentURL, accessToken);

    let dataset: Dataset;
    let vfield: VirtualField;

    before(async () => {
        dataset = await datasetsClient.create({
            name: datasetName,
            description: 'This is a test dataset for monitors integration tests.',
        });

        vfield = await client.create({
            dataset: dataset.id.toString(),
            name: 'Failed Requests',
            description: 'Statuses >= 400',
            alias: 'status_failed',
            expression: 'response >= 400',
        });
    });

    after(async () => {
        await client.delete(vfield.id!);

        await datasetsClient.delete(datasetName);
    });

    describe('update', () => {
        it('should update a vfield', async () => {
            const updatedVirtualField = await client.update(vfield.id!, {
                dataset: dataset.id.toString(),
                name: 'Failed Requests',
                description: 'Statuses > 399',
                alias: 'status_failed',
                expression: 'response > 399',
            });

            expect(updatedVirtualField.description).to.equal('Statuses > 399');

            vfield = updatedVirtualField;
        });
    });

    describe('get', () => {
        it('should get a vfield', async () => {
            const fetchedVirtualField = await client.get(vfield.id!);

            expect(fetchedVirtualField.name).to.equal(vfield.name);
        });
    });

    describe('list', () => {
        it('should list vfields', async () => {
            const vfields = await client.list({
                dataset: dataset.id.toString(),
            });

            expect(vfields.length).to.be.greaterThan(0);
        });
    });
});
