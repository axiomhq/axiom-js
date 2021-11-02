import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../../lib';
import { starred } from '../../lib/starred';

describe('StarredQueriesService', () => {
    const client = new starred.Service('http://axiom-node.dev.local');

    beforeEach(() => {
        const starred = [
            {
                kind: 'analytics',
                dataset: 'test',
                name: 'avg(size) shown',
                who: '610455ff-2b16-4e8a-a3c5-70adde1538ff',
                query: {
                    aggregations: [
                        {
                            op: 'avg',
                            field: 'size',
                        },
                    ],
                    startTime: '2020-11-24T16:23:15.000Z',
                    endTime: '2020-11-24T16:53:30.000Z',
                    resolution: '15s',
                },
                metadata: {
                    quickRange: '30m',
                },
                id: 'NBYj9rO5p4F5CtYEy6',
                created: '2020-11-24T16:53:38.267775284Z',
            },
            {
                kind: 'analytics',
                dataset: 'test',
                name: 'Everything',
                who: 'e9cffaad-60e7-4b04-8d27-185e1808c38c',
                query: {
                    startTime: '2020-11-24T16:23:15.000Z',
                    endTime: '2020-11-24T16:53:30.000Z',
                    limit: 1000,
                },
                metadata: {
                    quickRange: '7d',
                },
                id: 'NBYj9rO5p4F5CtYEy6',
                created: '2020-11-25T17:34:07.659355723Z',
            },
        ];

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/starred?dataset=test&kind=analytics&who=user').reply(200, starred);
        scope.get('/api/v1/starred/NBYj9rO5p4F5CtYEy6').reply(200, starred[0]);
        scope.post('/api/v1/starred').reply(200, starred[1]);
        scope.put('/api/v1/starred/NBYj9rO5p4F5CtYEy6').reply(200, starred[1]);
        scope.delete('/api/v1/starred/NBYj9rO5p4F5CtYEy6').reply(204);
    });

    it('List', async () => {
        const options: starred.ListOptions = {
            dataset: 'test',
            kind: starred.QueryKind.Analytics,
            who: starred.OwnerKind.User,
        };

        const response = await client.list(options);
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('NBYj9rO5p4F5CtYEy6');
        expect(response).not.equal('undefined');
        expect(response.id).equal('NBYj9rO5p4F5CtYEy6');
        expect(response.name).equal('avg(size) shown');
        expect(response.who).equal('610455ff-2b16-4e8a-a3c5-70adde1538ff');
    });

    it('Create', async () => {
        const starreds: starred.StarredQuery = {
            kind: starred.QueryKind.Analytics,
            dataset: 'test',
            name: 'Everything',
            // query: {
            //     startTime: '2020-11-24T16:23:15.000Z',
            //     endTime: '2020-11-24T16:53:30.000Z',
            //     limit: 1000,
            // },
            metadata: {
                quickRange: '7d',
            },
        };

        const response = await client.create(starreds);
        expect(response).not.equal('undefined');
        expect(response.id).equal('NBYj9rO5p4F5CtYEy6');
        expect(response.name).equal('Everything');
        expect(response.who).equal('e9cffaad-60e7-4b04-8d27-185e1808c38c');
    });

    it('Update', async () => {
        const starreds: starred.StarredQuery = {
            kind: starred.QueryKind.Analytics,
            dataset: 'test',
            name: 'Everything',
            // query: {
            //     startTime: '2020-11-24T16:23:15.000Z',
            //     endTime: '2020-11-24T16:53:30.000Z',
            //     limit: 1000,
            // },
            metadata: {
                quickRange: '7d',
            },
        };

        const response = await client.update('NBYj9rO5p4F5CtYEy6', starreds);
        expect(response).not.equal('undefined');
        expect(response.id).equal('NBYj9rO5p4F5CtYEy6');
        expect(response.name).equal('Everything');
        expect(response.who).equal('e9cffaad-60e7-4b04-8d27-185e1808c38c');
    });

    it('Delete', async () => {
        const response = await client.delete('NBYj9rO5p4F5CtYEy6');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
