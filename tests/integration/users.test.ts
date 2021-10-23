import { expect } from 'chai';

import UsersService, { User, Role } from '../../lib/users';

describe('UsersService', () => {
    const client = new UsersService();

    let user: User;

    before(async () => {
        user = await client.create({
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: Role.User,
        });
    });

    after(async () => {
        await client.delete(user.id!);
    });

    describe('get', () => {
        it('should get a user', async () => {
            const fetchedUser = await client.get(user.id!);

            expect(fetchedUser.name).to.equal(user.name);
        });
    });

    describe('list', () => {
        it('should list users', async () => {
            const users = await client.list();

            expect(users.length).to.be.greaterThan(0);
        });
    });
});
