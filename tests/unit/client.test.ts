import { fail } from 'assert';
import { AxiosError } from 'axios';
import { expect } from 'chai';
import nock from 'nock';

import Client from '../../lib/client';
import { datasets } from '../../lib/datasets';
import { headerIngestLimit, headerIngestRemaining, headerIngestReset, headerQueryLimit, headerQueryRemaining, headerQueryReset, headerRateLimit, headerRateRemaining, headerRateReset, headerRateScope } from '../../lib/limit';

describe('Client', () => {
    const client = new Client('http://axiom-node-retries.dev.local');
    expect(client).not.equal('undefined');

    it('Services', () => {
        expect(client.datasets).not.empty;
        expect(client.monitors).not.empty;
        expect(client.notifiers).not.empty;
        expect(client.starred).not.empty;
        expect(client.teams).not.empty;
        expect(client.tokens.api).not.empty;
        expect(client.tokens.personal).not.empty;
        expect(client.users).not.empty;
        expect(client.version).not.empty;
        expect(client.virtualFields).not.empty;
    });

    it('Retries failed 5xx requests', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        scope.get('/api/v1/datasets').reply(500, 'internal server error');
        scope.get('/api/v1/datasets').reply(500, 'internal server error');
        scope.get('/api/v1/datasets').reply(200, [{ name: 'test' }]);

        const resp = await client.datasets.list();
        expect(scope.isDone()).eq(true);
        expect(resp.length).eq(1);
    });

    it('Does not retry failed requests < 500', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        scope.get('/api/v1/datasets').reply(401, 'Forbidden');
        scope.get('/api/v1/datasets').reply(200, [{ name: 'test' }]);

        try {
            const resp = await client.datasets.list();
            fail('response should fail and return 401');
        } catch (err: any) {
            expect(err.response.status).eq(401);
            expect(err.response.data).eq('Forbidden');
            // Scope is not done means that not all scope mocks has been consumed
            expect(scope.isDone()).eq(false);
        }

        // create another request to ensure that
        // the nock scope was not consumed before
        const resp = await client.datasets.list();
        expect(scope.isDone()).to.be.true;
        expect(resp.length).eq(1);
    });

    it('Handles rate limits without sending remote request', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000) + 10;
        const headers: nock.ReplyHeaders = {}
        headers[headerRateScope] = 'anonymous';
        headers[headerRateLimit] = '1000';
        headers[headerRateRemaining] = '0';
        headers[headerRateReset] = timestampInSeconds.toString();
        scope.get('/api/v1/datasets').reply(499, 'Rate Limit Exceeded', headers);

        try {
            const resp = await client.datasets.list();
            fail("request should return an error with status 499");
        } catch (err: any) {
            expect(scope.isDone()).eq(true);
            expect(err.response.status).eq(499);
            expect(err.response.headers[headerRateScope.toLowerCase()]).eq('anonymous');
            expect(err.response.headers[headerRateRemaining.toLowerCase()]).eq('0');
        }

        try {
            const resp = await client.datasets.list();
            fail("request should return an error with status 499");
        } catch(err: any) {
            expect(err.response.status).eq(499);
            expect(err.response.headers['X-IngestLimit-Remaining'] == 0);
            expect(err.response.data).eq('anonymous rate limit exceeded, not making remote request')
        }
    });

    it('Handles ingest rate limits without sending remote request', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000) + 10;
        const headers: nock.ReplyHeaders = {}
        headers[headerIngestLimit] = '1000';
        headers[headerIngestRemaining] = '0';
        headers[headerIngestReset] = timestampInSeconds.toString();
        scope.post('/api/v1/datasets/test/ingest').reply(499, 'Rate Limit Exceeded', headers);

        try {
            const resp = await client.datasets.ingestString(
                'test',
                JSON.stringify([{ name: 'test' }]),
                datasets.ContentType.JSON,
                datasets.ContentEncoding.Identity,
            );
            fail("request should return an error with status 499");
        } catch (err: any) {
            expect(err.response.status).eq(499);
            expect(err.response.headers[headerIngestRemaining.toLowerCase()]).eq('0');
        }

        try {
            const resp = await client.datasets.ingestString(
                'test',
                JSON.stringify([{ name: 'test' }]),
                datasets.ContentType.JSON,
                datasets.ContentEncoding.Identity,
            );
            fail("request should return an error with status 499");
        } catch(err: any) {
            expect(err.response.status).eq(499);
            expect(err.response.headers['X-IngestLimit-Remaining'] == 0);
            expect(err.response.data).eq('anonymous ingest limit exceeded, not making remote request')
        }
    });

    it.only('Handles query rate limits without sending remote request', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000) + 10;
        const headers: nock.ReplyHeaders = {}
        headers[headerQueryLimit] = '1000';
        headers[headerQueryRemaining] = '0';
        headers[headerQueryReset] = timestampInSeconds.toString();
        scope.post('/api/v1/datasets/_apl?format=legacy').reply(499, 'Rate Limit Exceeded', headers);

        try {
            const resp = await client.datasets.aplQuery("['test']");
            fail("request should return an error with status 499");
        } catch (err: any) {
            expect(err.response.status).eq(499);
            expect(err.response.headers[headerQueryRemaining.toLowerCase()]).eq('0');
        }

        try {
            const resp = await client.datasets.aplQuery("['test']");
            fail("request should return an error with status 499");
        } catch(err: any) {
            expect(err.response.status).eq(499);
            expect(err.response.headers[headerQueryRemaining.toLowerCase()] == 0);
            expect(err.response.data).eq('anonymous query limit exceeded, not making remote request')
        }
    });
});
