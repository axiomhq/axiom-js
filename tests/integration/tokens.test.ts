/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import { IngestTokensService, PersonalTokensService, Token } from '../../lib/tokens';

const deploymentURL = process.env.AXIOM_URL || '';
const accessToken = process.env.AXIOM_TOKEN || '';

describe('IngestTokensService', () => {
    const client = new IngestTokensService(deploymentURL, accessToken);

    let token: Token;

    before(async () => {
        token = await client.create({
            name: 'Test Token',
            scopes: [],
        });
    });

    after(async () => {
        await client.delete(token.id!);
    });

    describe('update', () => {
        it('should update a token', async () => {
            const updatedToken = await client.update(token.id!, {
                name: 'Updated Test Token',
                scopes: [],
            });

            expect(updatedToken.name).to.equal('Updated Test Token');

            token = updatedToken;
        });
    });

    describe('get', () => {
        it('should get a token', async () => {
            const fetchedToken = await client.get(token.id!);

            expect(fetchedToken.name).to.equal(token.name);
        });
    });

    describe('view', () => {
        it('should view a token', async () => {
            const fetchedToken = await client.view(token.id!);

            expect(fetchedToken).to.be.not.empty;
        });
    });

    describe('list', () => {
        it('should list tokens', async () => {
            const tokens = await client.list();

            expect(tokens.length).to.be.greaterThan(0);
        });
    });

    describe('validate', () => {
        it('should validate token', async () => {
            const valid = await client.validate();

            expect(valid).to.be.true;
        });
    });
});

describe('PersonalTokensService', () => {
    const client = new PersonalTokensService(deploymentURL, accessToken);

    let token: Token;

    before(async () => {
        token = await client.create({
            name: 'Test Token',
            scopes: [],
        });
    });

    after(async () => {
        await client.delete(token.id!);
    });

    describe('update', () => {
        it('should update a token', async () => {
            const updatedToken = await client.update(token.id!, {
                name: 'Updated Test Token',
                scopes: [],
            });

            expect(updatedToken.name).to.equal('Updated Test Token');

            token = updatedToken;
        });
    });

    describe('get', () => {
        it('should get a token', async () => {
            const fetchedToken = await client.get(token.id!);

            expect(fetchedToken.name).to.equal(token.name);
        });
    });

    describe('view', () => {
        it('should view a token', async () => {
            const fetchedToken = await client.view(token.id!);

            expect(fetchedToken).to.be.not.empty;
        });
    });

    describe('list', () => {
        it('should list tokens', async () => {
            const tokens = await client.list();

            expect(tokens.length).to.be.greaterThan(0);
        });
    });
});
