import { expect } from 'chai';

import { tokens } from '../../lib/tokens';

describe('APITokensService', () => {
    const client = new tokens.APIService();

    let token: tokens.Token;

    before(async () => {
        token = await client.create({
            name: 'Test Token',
            scopes: ['*'],
            permissions: ['CanIngest'],
        });
    });

    after(async () => {
        await client.delete(token.id!);
    });

    describe('update', () => {
        it('should update a token', async () => {
            const updatedToken = await client.update(token.id!, {
                name: 'Updated Test Token',
                scopes: ['*'],
                permissions: ['CanQuery'],
            });

            expect(updatedToken.name).to.equal('Updated Test Token');
            expect(updatedToken.permissions).to.contain('CanQuery');
            expect(updatedToken.permissions).to.not.contain('CanIngest');

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

describe('PersonalTokensService', () => {
    const client = new tokens.PersonalService();

    let token: tokens.Token;

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
