import { expect } from 'chai';

import { version } from '../../lib/version';

describe('VersionService', () => {
    const client = new version.Service();

    describe('get', () => {
        it('should get a version', async () => {
            const version = await client.get();

            expect(version.currentVersion).to.satisfy((version: string) => version.startsWith('v1.'));
        });
    });
});
