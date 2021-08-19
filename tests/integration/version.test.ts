/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import VersionService from '../../lib/version';

const deploymentURL = process.env.AXIOM_URL || '';
const accessToken = process.env.AXIOM_TOKEN || '';

describe('VersionService', () => {
    const client = new VersionService(deploymentURL, accessToken);

    describe('get', () => {
        it('should get a version', async () => {
            const version = await client.get();

            expect(version.currentVersion).to.satisfy((version: string) => version.startsWith('v1.'));
        });
    });
});
