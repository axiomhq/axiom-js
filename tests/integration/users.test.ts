import { expect } from 'chai';

import { users } from '../../lib/users';

describe('UsersService', () => {
    const client = new users.Service();

    let user: users.User;

    before(async () => {
        user = await client.create({
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: users.Role.User,
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
