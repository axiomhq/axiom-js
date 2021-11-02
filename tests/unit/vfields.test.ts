import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../../lib';
import { vfields } from '../../lib/vfields';

describe('VirtualFieldsService', () => {
    const client = new vfields.Service('http://axiom-node.dev.local');

    beforeEach(() => {
        const vfields = [
            {
                dataset: 'test',
                name: 'status_success',
                description: 'Successful Requests',
                expression: 'response < 400',
                id: 'test.status_success',
            },
            {
                dataset: 'test',
                name: 'status_failed',
                description: 'Failed Requests',
                expression: 'response > 399',
                id: 'test.status_failed',
            },
        ];

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/vfields?dataset=test').reply(200, vfields);
        scope.get('/api/v1/vfields/test.status_success').reply(200, vfields[0]);
        scope.post('/api/v1/vfields').reply(200, vfields[1]);
        scope.put('/api/v1/vfields/test.status_failed').reply(200, vfields[1]);
        scope.delete('/api/v1/vfields/test.status_failed').reply(204);
    });

    it('List', async () => {
        const response = await client.list({
            dataset: 'test',
        });
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('test.status_success');
        expect(response).not.equal('undefined');
        expect(response.id).equal('test.status_success');
        expect(response.name).equal('status_success');
        expect(response.description).equal('Successful Requests');
    });

    it('Create', async () => {
        const vfield: vfields.VirtualField = {
            dataset: 'test',
            name: 'status_failed',
            description: 'Failed Requests',
            expression: 'response > 399',
        };

        const response = await client.create(vfield);
        expect(response).not.equal('undefined');
        expect(response.id).equal('test.status_failed');
        expect(response.name).equal('status_failed');
        expect(response.description).equal('Failed Requests');
    });

    it('Update', async () => {
        const vfield: vfields.VirtualField = {
            dataset: 'test',
            name: 'status_failed',
            description: 'Failed Requests',
            expression: 'response == 400',
        };

        const response = await client.update('test.status_failed', vfield);
        expect(response).not.equal('undefined');
        expect(response.id).equal('test.status_failed');
        expect(response.name).equal('status_failed');
        expect(response.description).equal('Failed Requests');
    });

    it('Delete', async () => {
        const response = await client.delete('test.status_failed');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
