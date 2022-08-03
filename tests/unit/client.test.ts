import { fail } from 'assert';
import { expect } from 'chai';
import nock from 'nock';

import Client from '../../lib/client';
import { datasets } from '../../lib/datasets';
import { AxiomTooManyRequestsError } from '../../lib/httpClient';
import { headerIngestLimit, headerIngestRemaining, headerIngestReset, headerQueryLimit, headerQueryRemaining, headerQueryReset, headerAPILimit, headerAPIRateRemaining, headerAPIRateReset, headerRateScope } from '../../lib/limit';

describe('Client', () => {
    let client = new Client('http://axiom-node-retries.dev.local');
    expect(client).not.equal('undefined');

    beforeEach(() => {
        // reset client to clear rate limits
        client = new Client('http://axiom-node-retries.dev.local');
    });

    it('Services', () => {
        expect(client.datasets).not.empty;
        expect(client.users).not.empty;
        expect(client.version).not.empty;
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

    it('shortcircuit API rate limit', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const resetTime = new Date();
        resetTime.setHours(resetTime.getHours() + 1);
        const resetTimeInSeconds = Math.floor(resetTime.getTime() / 1000);
        const headers: nock.ReplyHeaders = {}
        headers[headerRateScope] = 'anonymous';
        headers[headerAPILimit] = '1000';
        headers[headerAPIRateRemaining] = '0';
        headers[headerAPIRateReset] = resetTimeInSeconds.toString();
        scope.get('/api/v1/datasets').reply(200, {}, headers);

        await client.datasets.list();
        expect(scope.isDone()).eq(true);

        try {
            await client.datasets.list();
            fail("request should return an error with status 429");
        } catch(err: any) {
            expect(err).instanceOf(AxiomTooManyRequestsError);
            const untilReset = err.timeUntilReset();
            expect(err.message).eq(`anonymous api limit exceeded, not making remote request, try again in ${untilReset.minutes}m${untilReset.seconds}s`)
            expect(err.response.status).eq(429);
            expect(err.response.statusText).eq('Too Many Requests');
            expect(err.response.data).eq('');
        }
    });

    it('shortcircuit ingest rate limit', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const resetTime = new Date();
        resetTime.setHours(resetTime.getHours() + 1);
        const timestampInSeconds = Math.floor(resetTime.getTime() / 1000);
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
            const untilReset = err.timeUntilReset();
            expect(err.message).eq(`ingest limit exceeded, not making remote request, try again in ${untilReset.minutes}m${untilReset.seconds}s`)
            expect(err.response.data).eq('');
        }
    });

    it('shortcircuit query rate limit', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const resetTime = new Date();
        resetTime.setHours(resetTime.getHours() + 1);
        const resetTimeInSeconds = Math.floor(resetTime.getTime() / 1000);
        const headers: nock.ReplyHeaders = {}
        headers[headerQueryLimit] = '1000';
        headers[headerQueryRemaining] = '0';
        headers[headerQueryReset] = resetTimeInSeconds.toString();
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
            const untilReset = err.timeUntilReset();
            expect(err.message).eq(`query limit exceeded, not making remote request, try again in ${untilReset.minutes}m${untilReset.seconds}s`)
            expect(err.response.data).eq('');
        }
    });

    it('No shortcircuit for ingest or query when there is api rate limit', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        const resetTimeInSeconds = Math.floor(new Date().getTime() / 1000);
        const headers: nock.ReplyHeaders = {}
        headers[headerRateScope] = 'anonymous';
        headers[headerAPILimit] = '1000';
        headers[headerAPIRateRemaining] = '0';
        headers[headerAPIRateReset] = resetTimeInSeconds.toString();
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
