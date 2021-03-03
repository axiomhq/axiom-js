import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../lib';
import VersionsService from '../lib/version';

describe('VersionsService', () => {
    beforeEach(() => {
        const response = {
            currentVersion: 'v1.5.0-20210303T0900+a238738bf',
        };

        nock(CloudURL).get('/api/v1/version').reply(200, response);
    });

    const client = new VersionsService(CloudURL, '');
    expect(client).not.equal('undefined');

    it('Get', async () => {
        const response = await client.get();
        expect(response).not.equal('undefined');
        expect(response.currentVersion).equal('v1.5.0-20210303T0900+a238738bf');
    });
});
