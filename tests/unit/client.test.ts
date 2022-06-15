import { fail } from 'assert';
import { expect } from 'chai';
import nock from 'nock';

import Client from '../../lib/client';

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
        scope.get('/api/v1/datasets').reply(500, "internal server error");
        scope.get('/api/v1/datasets').reply(500, "internal server error");
        scope.get('/api/v1/datasets').reply(200, [{name: 'test'}]);

        const resp = await client.datasets.list();
        expect(scope.isDone()).eq(true);
        expect(resp.length).eq(1);
    });

    it('Does not retry failed requests < 500', async () => {
        const scope = nock('http://axiom-node-retries.dev.local');
        scope.get('/api/v1/datasets').reply(401, 'Forbidden');
        scope.get('/api/v1/datasets').reply(200, [{name: 'test'}]);

        try {
            const resp = await client.datasets.list()
            fail('response should fail and return 401')
        } catch (err: any) {
            expect(err.response.status).eq(401);
            expect(err.response.data).eq('Forbidden');
            // Scope is not done means that not all scope mocks has been consumed
            expect(scope.isDone()).eq(false);
        }

        // create another request to ensure that
        // the nock scope was not consumed before
        const resp = await client.datasets.list()
        expect(scope.isDone()).to.be.true;
        expect(resp.length).eq(1);
    });
});
