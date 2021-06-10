import { expect } from 'chai';

import DatasetsService from '../../lib/datasets';

const deploymentURL = process.env.AXIOM_DEPLOYMENT_URL!;
const accessToken = process.env.AXIOM_ACCESS_TOKEN!;
const datasetSuffix = process.env.DATASET_SUFFIX || 'local';

describe('DatasetsService', () => {
    const datasetName = `test-integration-axiom-node-${datasetSuffix}`;
    const client = new DatasetsService(deploymentURL, accessToken);

    before(async () => {
        await client.create({
            name: datasetName,
            description: 'Automatically created by axiom-node integration tests.',
        });
    });

    after(async () => {
        await client.delete(datasetName);
    });

    describe('Stats', () => {
        it('returns a valid response', async () => {
            const response = await client.stats();
            expect(response).not.to.equal('undefined');
            expect(response.datasets?.length).to.be.greaterThan(0);
        });
    });
});