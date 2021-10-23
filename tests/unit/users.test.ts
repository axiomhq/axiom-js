import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../../lib';
import UsersService, { Role, CreateRequest } from '../../lib/users';

describe('UsersService', () => {
    const client = new UsersService('http://axiom-node.dev.local');

    beforeEach(() => {
        const currentUser = {
            id: 'e9cffaad-60e7-4b04-8d27-185e1808c38c',
            name: 'Lukas Malkmus',
            emails: ['lukas@axiom.co'],
        };

        const users = [
            {
                id: '20475220-20e4-4080-b2f4-68315e21f5ec',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'owner',
                permissions: [],
            },
            {
                id: 'e9cffaad-60e7-4b04-8d27-185e1808c38c',
                name: 'Michael Doe',
                email: 'michael@example.com',
                role: 'owner',
                permissions: [
                    'CanUpdate',
                    'ChangeAccess',
                    'ChangeApiKeys',
                    'ChangeAuthentication',
                    'ChangeDashboards',
                    'ChangeIntegrations',
                    'ChangeMonitorsAndNotifiers',
                    'ChangeSavedQueries',
                    'ChangeVirtualFields',
                    'ManageBilling',
                    'ManageDatasets',
                    'ManageIngestTokens',
                ],
            },
        ];

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/user').reply(200, currentUser);
        scope.get('/api/v1/users').reply(200, users);
        scope.get('/api/v1/users/20475220-20e4-4080-b2f4-68315e21f5ec').reply(200, users[0]);
        scope.post('/api/v1/users').reply(200, users[1]);
        scope.put('/api/v1/users/e9cffaad-60e7-4b04-8d27-185e1808c38c').reply(200, users[1]);
        scope.delete('/api/v1/users/e9cffaad-60e7-4b04-8d27-185e1808c38c').reply(204);
    });

    it('Current', async () => {
        const response = await client.current();
        expect(response).not.equal('undefined');
        expect(response.name).equal('Lukas Malkmus');
        expect(response.emails).length(1);
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('20475220-20e4-4080-b2f4-68315e21f5ec');
        expect(response).not.equal('undefined');
        expect(response.id).equal('20475220-20e4-4080-b2f4-68315e21f5ec');
        expect(response.name).equal('John Doe');
        expect(response.role).equal(Role.Owner);
    });

    it('Create', async () => {
        const request: CreateRequest = {
            name: 'Michael Doe',
            email: 'michael@example.com',
            role: Role.Owner,
            teamIds: [],
        };

        const response = await client.create(request);
        expect(response).not.equal('undefined');
        expect(response.id).equal('e9cffaad-60e7-4b04-8d27-185e1808c38c');
        expect(response.name).equal('Michael Doe');
        expect(response.role).equal(Role.Owner);
        expect(response.permissions).length(12);
    });

    it('Update', async () => {
        const response = await client.update('e9cffaad-60e7-4b04-8d27-185e1808c38c', 'Michael Doe');
        expect(response).not.equal('undefined');
        expect(response.id).equal('e9cffaad-60e7-4b04-8d27-185e1808c38c');
        expect(response.name).equal('Michael Doe');
        expect(response.role).equal(Role.Owner);
        expect(response.permissions).length(12);
    });

    it('UpdateRole', async () => {
        const response = await client.updateRole('e9cffaad-60e7-4b04-8d27-185e1808c38c', Role.Owner);
        expect(response).not.equal('undefined');
        expect(response.id).equal('e9cffaad-60e7-4b04-8d27-185e1808c38c');
        expect(response.name).equal('Michael Doe');
        expect(response.role).equal(Role.Owner);
        expect(response.permissions).length(12);
    });

    it('Delete', async () => {
        const response = await client.delete('e9cffaad-60e7-4b04-8d27-185e1808c38c');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
