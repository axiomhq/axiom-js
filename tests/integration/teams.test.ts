import { expect } from 'chai';

import TeamsService, { Team } from '../../lib/teams';

describe('TeamsService', () => {
    const client = new TeamsService();

    let team: Team;

    before(async () => {
        team = await client.create({
            name: 'Test Team',
            datasets: [],
        });
    });

    after(async () => {
        await client.delete(team.id!);
    });

    describe('update', () => {
        it('should update a team', async () => {
            const updatedTeam = await client.update(team.id!, {
                name: 'Updated Test Team',
                members: [],
                datasets: [],
            });

            expect(updatedTeam.name).to.equal('Updated Test Team');

            team = updatedTeam;
        });
    });

    describe('get', () => {
        it('should get a team', async () => {
            const fetchedTeam = await client.get(team.id!);

            expect(fetchedTeam.name).to.equal(team.name);
        });
    });

    describe('list', () => {
        it('should list teams', async () => {
            const teams = await client.list();

            expect(teams.length).to.be.greaterThan(0);
        });
    });
});
