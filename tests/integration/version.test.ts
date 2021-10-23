import { expect } from 'chai';

import VersionService from '../../lib/version';

describe('VersionService', () => {
    const client = new VersionService();

    describe('get', () => {
        it('should get a version', async () => {
            const version = await client.get();

            expect(version.currentVersion).to.satisfy((version: string) => version.startsWith('v1.'));
        });
    });
});
