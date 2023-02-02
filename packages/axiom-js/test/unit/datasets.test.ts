import nock from 'nock';

import { datasets } from '../../src/datasets';

describe('DatasetsService', () => {
    const client = new datasets.Service({ url: 'http://axiom-js.dev.local' });

    beforeEach(() => {
        const datasets = [
            {
                id: 'test',
                name: 'test',
                description: 'Test dataset',
                who: 'f83e245a-afdc-47ad-a765-4addd1994333',
                created: '2020-11-17T22:29:00.521238198Z',
            },
            {
                id: 'test1',
                name: 'test1',
                description: 'This is a test description',
                who: 'f83e245a-afdc-47ad-a765-4addd1994333',
                created: '2020-11-17T22:29:00.521238198Z',
            },
        ];

        const scope = nock('http://axiom-js.dev.local');

        scope.get('/v1/datasets').reply(200, datasets);
        scope.get('/v1/datasets/test').reply(200, datasets[0]);
        scope.post('/v1/datasets').reply(200, datasets[1]);
        scope.put('/v1/datasets/test1').reply(200, datasets[1]);
        scope.delete('/v1/datasets/test1').reply(204);
        scope.post('/v1/datasets/test1/trim').reply(200, {});
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.toEqual('undefined');
        expect(response).toHaveLength(2);
    });

    it('Get', async () => {
        const response = await client.get('test');
        expect(response).not.toEqual('undefined');
        expect(response.id).toEqual('test');
        expect(response.description).toEqual('Test dataset');
    });

    it('Create', async () => {
        const request: datasets.CreateRequest = {
            name: 'test1',
            description: 'This is a test description',
        };

        const response = await client.create(request);
        expect(response).not.toEqual('undefined');
        expect(response.id).toEqual('test1');
        expect(response.description).toEqual('This is a test description');
    });

    it('Update', async () => {
        const req: datasets.UpdateRequest = {
            description: 'This is a test description',
        };

        const response = await client.update('test1', req);
        expect(response).not.toEqual('undefined');
        expect(response.id).toEqual('test1');
        expect(response.description).toEqual('This is a test description');
    });

    it('Delete', async () => {
        const response = await client.delete('test1');
        expect(response).not.toEqual('undefined');
        expect(response.status).toEqual(204);
    });

    it('Trim', async () => {
        const response = await client.trim('test1', '30m');
        expect(response).not.toEqual('undefined');
    });
});
