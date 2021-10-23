import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../../lib';
import VersionsService from '../../lib/version';

describe('VersionsService', () => {
    const client = new VersionsService('http://axiom-node.dev.local');

    beforeEach(() => {
        const response = {
            currentVersion: 'v1.5.0-20210303T0900+a238738bf',
        };

        nock('http://axiom-node.dev.local').get('/api/v1/version').reply(200, response);
    });

    it('Get', async () => {
        const response = await client.get();
        expect(response).not.equal('undefined');
        expect(response.currentVersion).equal('v1.5.0-20210303T0900+a238738bf');
    });
});
