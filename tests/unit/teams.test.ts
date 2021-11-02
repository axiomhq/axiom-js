import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../../lib';
import { teams } from '../../lib/teams';

describe('TeamsService', () => {
    const client = new teams.Service('http://axiom-node.dev.local');

    beforeEach(() => {
        const teams = [
            {
                id: 'CcXzGSwIFeshgnHTmD',
                name: 'Test',
                members: ['7debe8bb-69f1-436f-94f6-a2fe23e71cf5'],
                datasets: ['logs'],
            },
            {
                id: '4miTfZKp29VByAQgTd',
                name: 'Server Team',
                members: [],
                datasets: ['test'],
            },
        ];

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/teams').reply(200, teams);
        scope.get('/api/v1/teams/CcXzGSwIFeshgnHTmD').reply(200, teams[0]);
        scope.post('/api/v1/teams').reply(200, teams[1]);
        scope.put('/api/v1/teams/4miTfZKp29VByAQgTd').reply(200, teams[1]);
        scope.delete('/api/v1/teams/4miTfZKp29VByAQgTd').reply(204);
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('CcXzGSwIFeshgnHTmD');
        expect(response).not.equal('undefined');
        expect(response.id).equal('CcXzGSwIFeshgnHTmD');
        expect(response.name).equal('Test');
        expect(response.members).length(1);
        expect(response.datasets).length(1);
    });

    it('Create', async () => {
        const request: teams.CreateRequest = {
            name: 'Server Team',
            datasets: ['test'],
        };

        const response = await client.create(request);
        expect(response).not.equal('undefined');
        expect(response.id).equal('4miTfZKp29VByAQgTd');
        expect(response.name).equal('Server Team');
        expect(response.members).length(0);
        expect(response.datasets).length(1);
    });

    it('Update', async () => {
        const team: teams.Team = {
            name: 'Server Team',
            members: [],
            datasets: ['test'],
        };

        const response = await client.update('4miTfZKp29VByAQgTd', team);
        expect(response).not.equal('undefined');
        expect(response.id).equal('4miTfZKp29VByAQgTd');
        expect(response.name).equal('Server Team');
        expect(response.members).length(0);
        expect(response.datasets).length(1);
    });

    it('Delete', async () => {
        const response = await client.delete('4miTfZKp29VByAQgTd');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
