import { fail } from 'assert';
import { expect } from 'chai';
import nock from 'nock';

import Client from '../../lib/client';
import { datasets } from '../../lib/datasets';
import { AxiomTooManyRequestsError } from '../../lib/httpClient';
import { headerIngestLimit, headerIngestRemaining, headerIngestReset, headerQueryLimit, headerQueryRemaining, headerQueryReset, headerAPILimit, headerAPIRateRemaining, headerAPIRateReset, headerRateScope } from '../../lib/limit';

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

    it('API rate limit shortcircuit without sending remote request', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000) + 10;
        const headers: nock.ReplyHeaders = {}
        headers[headerRateScope] = 'anonymous';
        headers[headerAPILimit] = '1000';
        headers[headerAPIRateRemaining] = '0';
        headers[headerAPIRateReset] = timestampInSeconds.toString();
        scope.get('/api/v1/datasets').reply(200, {}, headers);

        await client.datasets.list();
        expect(scope.isDone()).eq(true);

        try {
            await client.datasets.list();
            fail("request should return an error with status 429");
        } catch(err: any) {
            expect(err).instanceOf(AxiomTooManyRequestsError);
            expect(err.message).eq('anonymous api limit exceeded, not making remote request')
            expect(err.response.status).eq(429);
            expect(err.response.statusText).eq('Too Many Requests');
            expect(err.response.data).eq('');
        }
    });

    it('Ingest rate limit shortcircuit without sending remote request', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000) + 10;
        const headers: nock.ReplyHeaders = {}
        headers[headerIngestLimit] = '1000';
        headers[headerIngestRemaining] = '0';
        headers[headerIngestReset] = timestampInSeconds.toString();
        scope.post('/api/v1/datasets/test/ingest').reply(200, {}, headers);

        await client.datasets.ingestString(
            'test',
            JSON.stringify([{ name: 'test' }]),
            datasets.ContentType.JSON,
            datasets.ContentEncoding.Identity,
        );

        try {
            await client.datasets.ingestString(
                'test',
                JSON.stringify([{ name: 'test' }]),
                datasets.ContentType.JSON,
                datasets.ContentEncoding.Identity,
            );
            fail("request should return an error with status 429");
        } catch(err: any) {
            expect(err).instanceOf(AxiomTooManyRequestsError);
            expect(err.response.status).eq(429);
            expect(err.response.statusText).eq('Too Many Requests');
            expect(err.message).eq('ingest limit exceeded, not making remote request')
            expect(err.response.data).eq('');
        }
    });

    it('Query rate limit shortcircuit without sending remote request', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const resetTime = new Date();
        resetTime.setHours(resetTime.getHours() + 2);
        const resetTimestamp = Math.floor(resetTime.getTime() / 1000);
        const headers: nock.ReplyHeaders = {}
        headers[headerQueryLimit] = '1000';
        headers[headerQueryRemaining] = '0';
        headers[headerQueryReset] = resetTimestamp.toString();
        scope.post('/api/v1/datasets/_apl?format=legacy').reply(200, {}, headers);

        // make successful request and parse the limit headers
        await client.datasets.aplQuery("['test']");
        expect(scope.isDone()).eq(true);

        // second request should fail without sending remote request
        try {
            await client.datasets.aplQuery("['test']");
            fail("request should return an error with status 429");
        } catch(err: any) {
            expect(err).instanceOf(AxiomTooManyRequestsError);
            expect(err.response.status).eq(429);
            expect(err.response.statusText).eq('Too Many Requests');
            expect(err.message).eq('query limit exceeded, not making remote request, try again in 59m1s')
            expect(err.response.data).eq('');
        }
    });

    it('No shortcircuit for ingest or query when there is api rate limit', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000) + 10;
        const headers: nock.ReplyHeaders = {}
        headers[headerRateScope] = 'anonymous';
        headers[headerAPILimit] = '1000';
        headers[headerAPIRateRemaining] = '0';
        headers[headerAPIRateReset] = timestampInSeconds.toString();
        scope.get('/api/v1/datasets').reply(429, 'Too Many Requests', headers);
        scope.post('/api/v1/datasets/test/ingest').reply(200, {}, headers);
        scope.post('/api/v1/datasets/_apl?format=legacy').reply(200, {}, headers);

        // first api call should fail
        try {
            const resp = await client.datasets.list();
            fail("request should return an error with status 429");
        } catch(err: any) {
            expect(err).instanceOf(AxiomTooManyRequestsError);
        }

        // ingest and query should succeed
        await client.datasets.ingestString(
            'test',
            JSON.stringify([{ name: 'test' }]),
            datasets.ContentType.JSON,
            datasets.ContentEncoding.Identity,
        );


        await client.datasets.aplQuery("['test']");
    })
});
