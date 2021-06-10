import { expect } from 'chai';

import DatasetsService from '../../lib/datasets';

const deploymentURL = process.env.AXM_DEPLOYMENT_URL!;
const accessToken = process.env.AXM_ACCESS_TOKEN!;

describe('DatasetsService', () => {
    const client = new DatasetsService(deploymentURL, accessToken);

    describe('Stats', () => {
        it('returns a valid response', async () => {
            const response = await client.stats();
            expect(response).not.to.equal('undefined');
            expect(response.datasets?.length).to.be.greaterThan(0);
        });
    });
});
