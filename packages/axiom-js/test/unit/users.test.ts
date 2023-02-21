import { users } from '../../src/users';
import { mockFetchResponse } from '../lib/mock';

const currentUser = {
    id: 'e9cffaad-60e7-4b04-8d27-185e1808c38c',
    name: 'Lukas Malkmus',
    emails: ['lukas@axiom.co'],
};

describe('UsersService', () => {
    const client = new users.Service({ url: 'http://axiom-js.dev.local' });

    it('Current', async () => {
        global.fetch = mockFetchResponse(currentUser)
        const response = await client.current();
        expect(response).toBeDefined();
        expect(response.id).toEqual(currentUser.id);
        expect(response.name).toEqual(currentUser.name);
        expect(response.emails).toHaveLength(1);
    });
});
