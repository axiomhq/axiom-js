import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../../lib';
import { PersonalTokensService, Token } from '../../lib/tokens';

// HINT(lukasmalkmus): The tests below just test against the "personal"
// endpoint. However, the "ingest" implementation is the same. Under the hood,
// they both use the TokenService. The integration tests make sure this
// implementation works against both endpoints.

describe('TokensService', () => {
    const client = new PersonalTokensService('http://axiom-node.dev.local');

    beforeEach(() => {
        const tokens = [
            {
                id: '08fceb797a467c3c23151f3584c31cfa',
                name: 'Test',
                scopes: ['*'],
            },
        ];

        const rawToken = {
            token: 'ae51e8d9-5fa2-4957-9847-3c1ccfa5ffe9',
            scopes: ['*'],
        };

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/tokens/personal').reply(200, tokens);
        scope.get('/api/v1/tokens/personal/08fceb797a467c3c23151f3584c31cfa').reply(200, tokens[0]);
        scope.get('/api/v1/tokens/personal/08fceb797a467c3c23151f3584c31cfa/token').reply(200, rawToken);
        scope.post('/api/v1/tokens/personal').reply(200, tokens[0]);
        scope.put('/api/v1/tokens/personal/08fceb797a467c3c23151f3584c31cfa').reply(200, tokens[0]);
        scope.delete('/api/v1/tokens/personal/08fceb797a467c3c23151f3584c31cfa').reply(204);
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(1);
    });

    it('Get', async () => {
        const response = await client.get('08fceb797a467c3c23151f3584c31cfa');
        expect(response).not.equal('undefined');
        expect(response.id).equal('08fceb797a467c3c23151f3584c31cfa');
        expect(response.name).equal('Test');
    });

    it('View', async () => {
        const response = await client.view('08fceb797a467c3c23151f3584c31cfa');
        expect(response).not.equal('undefined');
        expect(response.token).equal('ae51e8d9-5fa2-4957-9847-3c1ccfa5ffe9');
        expect(response.scopes).not.empty;
    });

    it('Create', async () => {
        const token: Token = {
            name: 'Test',
            description: 'A test token',
            scopes: ['*'],
        };

        const response = await client.create(token);
        expect(response).not.equal('undefined');
        expect(response.id).equal('08fceb797a467c3c23151f3584c31cfa');
        expect(response.name).equal('Test');
    });

    it('Update', async () => {
        const token: Token = {
            name: 'Test',
            description: 'A test token',
            scopes: ['*'],
        };

        const response = await client.update('08fceb797a467c3c23151f3584c31cfa', token);
        expect(response).not.equal('undefined');
        expect(response.id).equal('08fceb797a467c3c23151f3584c31cfa');
        expect(response.name).equal('Test');
    });

    it('Delete', async () => {
        const response = await client.delete('08fceb797a467c3c23151f3584c31cfa');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
