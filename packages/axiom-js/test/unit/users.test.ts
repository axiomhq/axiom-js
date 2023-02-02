import nock from 'nock';

import { users } from '../../src/users';

describe('UsersService', () => {
    const client = new users.Service({ url: 'http://axiom-js.dev.local' });

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
        ];

        const scope = nock('http://axiom-js.dev.local');

        scope.get('/v1/user').reply(200, currentUser);
        scope.get('/v1/users/20475220-20e4-4080-b2f4-68315e21f5ec').reply(200, users[0]);
    });

    it('Current', async () => {
        const response = await client.current();
        expect(response).not.toEqual('undefined');
        expect(response.name).toEqual('Lukas Malkmus');
        expect(response.emails).toHaveLength(1);
    });
});
