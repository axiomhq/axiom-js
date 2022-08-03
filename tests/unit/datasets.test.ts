import { expect } from 'chai';
import nock from 'nock';

import { datasets } from '../../lib/datasets';
import { starred } from '../../lib/starred';

describe('DatasetsService', () => {
    const client = new datasets.Service('http://axiom-node.dev.local');

    beforeEach(() => {
        const stats = {
            datasets: [
                {
                    name: 'test',
                    numBlocks: 1,
                    numEvents: 68459,
                    numFields: 8,
                    inputBytes: 10383386,
                    inputBytesHuman: '10 MB',
                    compressedBytes: 2509224,
                    compressedBytesHuman: '2.5 MB',
                    minTime: '2020-11-17T22:30:59Z',
                    maxTime: '2020-11-18T17:31:55Z',
                    fields: [
                        {
                            name: '_sysTime',
                            type: 'integer',
                        },
                        {
                            name: '_time',
                            type: 'integer',
                        },
                        {
                            name: 'path',
                            type: 'string',
                        },
                        {
                            name: 'size',
                            type: 'integer',
                        },
                        {
                            name: 'status',
                            type: 'integer',
                        },
                    ],
                    who: 'f83e245a-afdc-47ad-a765-4addd1994333',
                    created: '2020-11-18T21:30:20.623322799Z',
                },
                {
                    name: 'test1',
                    numBlocks: 1,
                    numEvents: 68459,
                    numFields: 8,
                    inputBytes: 10383386,
                    inputBytesHuman: '10 MB',
                    compressedBytes: 2509224,
                    compressedBytesHuman: '2.5 MB',
                    minTime: '2020-11-17T22:30:59Z',
                    maxTime: '2020-11-18T17:31:55Z',
                    fields: [
                        {
                            name: '_sysTime',
                            type: 'integer',
                        },
                        {
                            name: '_time',
                            type: 'integer',
                        },
                        {
                            name: 'path',
                            type: 'string',
                        },
                        {
                            name: 'size',
                            type: 'integer',
                        },
                        {
                            name: 'status',
                            type: 'integer',
                        },
                    ],
                    who: 'f83e245a-afdc-47ad-a765-4addd1994333',
                    created: '2020-11-18T21:30:20.623322799Z',
                },
            ],
            numBlocks: 2,
            numEvents: 136918,
            inputBytes: 666337356,
            inputBytesHuman: '666 MB',
            compressedBytes: 19049348,
            compressedBytesHuman: '19 MB',
        };

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

        const ingestStatus = {
            ingested: 2,
            failed: 0,
            failures: [],
            processedBytes: 630,
            blocksCreated: 0,
            walLength: 2,
        };

        const queryResult = {
            status: {
                elapsedTime: 542114,
                blocksExamined: 4,
                rowsExamined: 142655,
                rowsMatched: 142655,
                numGroups: 0,
                isPartial: false,
                cacheStatus: 1,
                minBlockTime: '2020-11-19T11:06:31.569475746Z',
                maxBlockTime: '2020-11-27T12:06:38.966791794Z',
            },
            matches: [
                {
                    _time: '2020-11-19T11:06:31.569475746Z',
                    _sysTime: '2020-11-19T11:06:31.581384524Z',
                    _rowId: 'c776x1uafkpu-4918f6cb9000095-0',
                    data: {
                        agent: 'Debian APT-HTTP/1.3 (0.8.16~exp12ubuntu10.21)',
                        bytes: 0,
                        referrer: '-',
                        remote_ip: '93.180.71.3',
                        remote_user: '-',
                        request: 'GET /downloads/product_1 HTTP/1.1',
                        response: 304,
                        time: '17/May/2015:08:05:32 +0000',
                    },
                },
                {
                    _time: '2020-11-19T11:06:31.569479846Z',
                    _sysTime: '2020-11-19T11:06:31.581384524Z',
                    _rowId: 'c776x1uafnvq-4918f6cb9000095-1',
                    data: {
                        agent: 'Debian APT-HTTP/1.3 (0.8.16~exp12ubuntu10.21)',
                        bytes: 0,
                        referrer: '-',
                        remote_ip: '93.180.71.3',
                        remote_user: '-',
                        request: 'GET /downloads/product_1 HTTP/1.1',
                        response: 304,
                        time: '17/May/2015:08:05:23 +0000',
                    },
                },
            ],
            buckets: {
                series: [],
                totals: [],
            },
        };

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/datasets/_stats').reply(200, stats);
        scope.get('/api/v1/datasets').reply(200, datasets);
        scope.get('/api/v1/datasets/test').reply(200, datasets[0]);
        scope.post('/api/v1/datasets').reply(200, datasets[1]);
        scope.put('/api/v1/datasets/test1').reply(200, datasets[1]);
        scope.put('/api/v1/datasets/test1/fields/response').reply(200, datasets[1]);
        scope.delete('/api/v1/datasets/test1').reply(204);
        scope.get('/api/v1/datasets/test/info').reply(200, stats.datasets[0]);
        scope.post('/api/v1/datasets/test1/trim').reply(200, {
            numDeleted: 1,
        });
        scope.post('/api/v1/datasets/test/ingest').reply(function (_, body, cb) {
            expect(this.req.headers).to.have.property('content-type');
            expect(body).to.deep.equal([{ foo: 'bar' }, { foo: 'baz' }]);

            cb(null, [200, ingestStatus]);
        });
        scope.post('/api/v1/datasets/test/query').reply(200, queryResult);
        scope.post('/api/v1/datasets/test/query?streaming-duration=1m&nocache=true').reply(200, queryResult);
        scope.post('/api/v1/datasets/_apl').reply(200, queryResult);
        scope.post('/api/v1/datasets/_apl?streaming-duration=1m&nocache=true').reply(200, queryResult);
    });

    it('Stats', async () => {
        const response = await client.stats();
        expect(response).not.equal('undefined');
        expect(response.datasets).length(2);
        expect(response.numBlocks).equal(2);
        expect(response.numEvents).equal(136918);
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('test');
        expect(response).not.equal('undefined');
        expect(response.id).equal('test');
        expect(response.description).equal('Test dataset');
    });

    it('Create', async () => {
        const request: datasets.CreateRequest = {
            name: 'test1',
            description: 'This is a test description',
        };

        const response = await client.create(request);
        expect(response).not.equal('undefined');
        expect(response.id).equal('test1');
        expect(response.description).equal('This is a test description');
    });

    it('Update', async () => {
        const req: datasets.UpdateRequest = {
            description: 'This is a test description',
        };

        const response = await client.update('test1', req);
        expect(response).not.equal('undefined');
        expect(response.id).equal('test1');
        expect(response.description).equal('This is a test description');
    });

    it('UpdateField', async () => {
        const req: datasets.UpdateFieldRequest = {
            description: 'This is a test description',
            unit: '',
            hidden: false,
        };

        const response = await client.updateField('test1', 'response', req);
        expect(response).not.equal('undefined');
        expect(response.description).equal('This is a test description');
    });

    it('Delete', async () => {
        const response = await client.delete('test1');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });

    it('Info', async () => {
        const response = await client.info('test');
        expect(response).not.equal('undefined');
        expect(response.name).equal('test');
        expect(response.numBlocks).equal(1);
        expect(response.numEvents).equal(68459);
    });

    it('Trim', async () => {
        const response = await client.trim('test1', '30m');
        expect(response).not.equal('undefined');
        expect(response.numDeleted).equal(1);
    });

    it('IngestString', async () => {
        const data = `[{"foo": "bar"}, {"foo": "baz"}]`;
        const response = await client.ingestString(
            'test',
            data,
            datasets.ContentType.JSON,
            datasets.ContentEncoding.Identity,
        );
        expect(response).not.equal('undefined');
        expect(response.ingested).equal(2);
        expect(response.failed).equal(0);
    });

    it('Query', async () => {
        it('works without options', async () => {
            const query = {
                startTime: '2020-11-26T11:18:00Z',
                endTime: '2020-11-17T11:18:00Z',
                resolution: 'auto',
            };
            const response = await client.query('test', query);
            expect(response).not.equal('undefined');
            expect(response.matches).length(2);
        });

        it('works with options', async () => {
            const query = {
                startTime: '2020-11-26T11:18:00Z',
                endTime: '2020-11-17T11:18:00Z',
                resolution: 'auto',
            };
            const options = {
                streamingDuration: '1m',
                noCache: true,
            };
            const response = await client.query('test', query, options);
            expect(response).not.equal('undefined');
            expect(response.matches).length(2);
        });
    });

    it('APL Query', async () => {
        it('works without options', async () => {
            const response = await client.aplQuery("['test'] | where response == 304");
            expect(response).not.equal('undefined');
            expect(response.matches).length(2);
        });

        it('works with options', async () => {
            const options = {
                streamingDuration: '1m',
                noCache: true,
            };
            const response = await client.aplQuery("['test'] | where response == 304", options);
            expect(response).not.equal('undefined');
            expect(response.matches).length(2);
        });
    });
});
