import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../lib';
import VirtualFieldsService, { VirtualField } from '../lib/vfields';

describe('VirtualFieldsService', () => {
    const client = new VirtualFieldsService(CloudURL, '');

    beforeEach(() => {
        const vfields = [
            {
                dataset: 'test',
                name: 'Successful Requests',
                description: 'Statuses <= x < 400',
                alias: 'status_success',
                expression: 'response <= 200 && response < 400',
                id: 'PiGheBIFBc4Khn4dBZ',
            },
            {
                dataset: 'test',
                name: 'Failed Requests',
                description: 'Statuses >= 400',
                alias: 'status_failed',
                expression: 'response >= 400',
                id: 'FmgciXxL3njoNgzWVR',
            },
        ];

        const scope = nock(CloudURL);

        scope.get('/api/v1/vfields').reply(200, vfields);
        scope.get('/api/v1/vfields/PiGheBIFBc4Khn4dBZ').reply(200, vfields[0]);
        scope.post('/api/v1/vfields').reply(200, vfields[1]);
        scope.put('/api/v1/vfields/FmgciXxL3njoNgzWVR').reply(200, vfields[1]);
        scope.delete('/api/v1/vfields/FmgciXxL3njoNgzWVR').reply(204);
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('PiGheBIFBc4Khn4dBZ');
        expect(response).not.equal('undefined');
        expect(response.id).equal('PiGheBIFBc4Khn4dBZ');
        expect(response.name).equal('Successful Requests');
    });

    it('Create', async () => {
        const vfield: VirtualField = {
            dataset: 'test',
            name: 'Failed Requests',
            description: 'Statuses >= 400',
            alias: 'status_failed',
            expression: 'response >= 400',
            id: 'FmgciXxL3njoNgzWVR',
        };

        const response = await client.create(vfield);
        expect(response).not.equal('undefined');
        expect(response.id).equal('FmgciXxL3njoNgzWVR');
        expect(response.name).equal('Failed Requests');
    });

    it('Update', async () => {
        const vfield: VirtualField = {
            dataset: 'test',
            name: 'Failed Requests',
            description: 'Statuses >= 400',
            alias: 'status_failed',
            expression: 'response >= 400',
            id: 'FmgciXxL3njoNgzWVR',
        };

        const response = await client.update('FmgciXxL3njoNgzWVR', vfield);
        expect(response).not.equal('undefined');
        expect(response.id).equal('FmgciXxL3njoNgzWVR');
        expect(response.name).equal('Failed Requests');
    });

    it('Delete', async () => {
        const response = await client.delete('FmgciXxL3njoNgzWVR');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
