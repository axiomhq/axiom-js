import nock from 'nock';

import Client, { ContentType, ContentEncoding } from '../../src/client';
import { AxiomTooManyRequestsError } from '../../src/httpClient';
import { headerAPILimit, headerAPIRateRemaining, headerAPIRateReset, headerRateScope } from '../../src/limit';
import { mockFetchResponse, testMockedFetchCall } from '../lib/mock';

const queryLegacyResult = {
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

const queryResult = {
    request: {
        startTime: '2020-11-19T11:06:31.569475746Z',
        endTime: '2020-11-27T12:06:38.966791794Z',
        resolution: 'auto',
    },
    ...queryLegacyResult,
};

const clientURL = 'http://axiom-js-retries.dev.local';

describe('Client', () => {
    let client = new Client({ url: clientURL });
    expect(client).toBeDefined();

    beforeEach(() => {
        // reset client to clear rate limits
        client = new Client({ url: clientURL });
    });

    it('Services', () => {
        expect(client.datasets).toBeTruthy();
        expect(client.users).toBeTruthy();
    });

    it('Retries failed 5xx requests', async () => {
        // TODO: this doesn't actually check that retries happend, fix
        global.fetch = mockFetchResponse({}, 500);
        global.fetch = mockFetchResponse({}, 500);
        global.fetch = mockFetchResponse([{ name: 'test' }], 200);

        const resp = await client.datasets.list();
        // expect(fetch).toHaveBeenCalledTimes(3);
        expect(resp.length).toEqual(1);
    });

    it('Does not retry failed requests < 500', async () => {
        // TODO: this doesn't actually check that retries happend or not, fix
        global.fetch = mockFetchResponse({}, 401);
        global.fetch = mockFetchResponse([{ name: 'test' }], 200);

        try {
            await client.datasets.list();
            fail('response should fail and return 401');
        } catch (err: any) {
            expect(err.response.status).toEqual(401);
            expect(err.response.data).toEqual('Forbidden');
            expect(fetch).toHaveBeenCalledTimes(1);
        }

        // create another request to ensure that
        // the nock scope was not consumed before
        const resp = await client.datasets.list();
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(resp.length).toEqual(1);
    });

    it('No shortcircuit for ingest or query when there is api rate limit', async () => {
        // const scope = nock(clientURL);
        const resetTimeInSeconds = Math.floor(new Date().getTime() / 1000);
        const headers: nock.ReplyHeaders = {};
        headers[headerRateScope] = 'anonymous';
        headers[headerAPILimit] = '1000';
        headers[headerAPIRateRemaining] = '0';
        headers[headerAPIRateReset] = resetTimeInSeconds.toString();
        // scope.get('/v1/datasets').reply(429, 'Too Many Requests', headers);
        // scope.post('/v1/datasets/test/ingest').reply(200, {}, headers);
        // scope.post('/v1/datasets/_apl?format=legacy').reply(200, {}, headers);
        global.fetch = mockFetchResponse({}, 429, headers);
        global.fetch = mockFetchResponse({}, 200, headers);
        global.fetch = mockFetchResponse({}, 200, headers);

        // first api call should fail
        try {
            await client.datasets.list();
            fail('request should return an error with status 429');
        } catch (err: any) {
            expect(err instanceof AxiomTooManyRequestsError).toEqual(true);
        }

        // ingest and query should succeed
        await client.ingest('test', JSON.stringify([{ name: 'test' }]), ContentType.JSON, ContentEncoding.Identity);

        await client.query("['test']");
    });

    it('IngestString', async () => {
        const query = [{"foo": "bar"}, {"foo": "baz"}];

        const ingestStatus = {
            ingested: 2,
            failed: 0,
            failures: [],
            processedBytes: 630,
            blocksCreated: 0,
            walLength: 2,
        };
        global.fetch = testMockedFetchCall((url: string, init: RequestInit) => {
            expect(init.headers).toHaveProperty('content-type');
            expect(init.body).toMatch(JSON.stringify(query))
        }, ingestStatus);

        const response = await client.ingest('test', JSON.stringify(query), ContentType.JSON, ContentEncoding.Identity);
        expect(response).toBeDefined();
        expect(response.ingested).toEqual(2);
        expect(response.failed).toEqual(0);
    });

    it('Query', async () => {
        global.fetch = mockFetchResponse(queryLegacyResult);

        // works without options
        let query = {
            startTime: '2020-11-26T11:18:00Z',
            endTime: '2020-11-17T11:18:00Z',
            resolution: 'auto',
        };
        let response = await client.queryLegacy('test', query);
        expect(response).toBeDefined();
        expect(response.matches).toHaveLength(2);

        // works with options
        query = {
            startTime: '2020-11-26T11:18:00Z',
            endTime: '2020-11-17T11:18:00Z',
            resolution: 'auto',
        };
        const options = {
            streamingDuration: '1m',
            noCache: true,
        };

        global.fetch = mockFetchResponse(queryLegacyResult);
        response = await client.queryLegacy('test', query, options);
        expect(response).toBeDefined();
        expect(response.matches).toHaveLength(2);
    });

    it('APL Query', async () => {
        global.fetch = mockFetchResponse(queryResult);
        // works without options
        let response = await client.query("['test'] | where response == 304");
        expect(response).not.toEqual('undefined');
        expect(response.matches).toHaveLength(2);

        // works with options
        const options = {
            streamingDuration: '1m',
            noCache: true,
        };

        global.fetch = mockFetchResponse(queryResult);
        response = await client.query("['test'] | where response == 304", options);
        expect(response).not.toEqual('undefined');
        expect(response.matches).toHaveLength(2);
    });
});
