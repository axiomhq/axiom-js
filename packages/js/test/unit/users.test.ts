import { describe, expect, it } from 'vitest';

import { users } from '../../src/users';
import { testMockedFetchCall } from '../lib/mock';

const baseUrl = 'http://axiom-js.dev.local';
const currentUser: users.User = {
  id: 'e9cffaad-60e7-4b04-8d27-185e1808c38c',
  name: 'Lukas Malkmus',
  email: 'lukas@axiom.co',
  role: {
    id: 'owner',
    name: 'Owner',
  },
};
const otherUser: users.User = {
  id: 'usr_123456789',
  name: 'Axiom User',
  email: 'user@example.com',
  role: {
    id: 'admin',
    name: 'Admin',
  },
};

describe('UsersService', () => {
  const client = new users.Service({ url: baseUrl, token: 'test-token' });

  it('gets the current user', async () => {
    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/user`);
      expect(init.method).toEqual('GET');
    }, currentUser);

    const response = await client.current();
    expect(response).toBeDefined();
    expect(response.id).toEqual(currentUser.id);
    expect(response.name).toEqual(currentUser.name);
    expect(response.email).toEqual(currentUser.email);
    expect(response.role?.id).toEqual(currentUser.role?.id);
  });

  it('sends the org header on current user requests', async () => {
    const orgClient = new users.Service({ url: baseUrl, token: 'test-token', orgId: 'org-id' });

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/user`);
      expect(init.method).toEqual('GET');
      expect(init.headers).toMatchObject({
        Authorization: 'Bearer test-token',
        'X-Axiom-Org-Id': 'org-id',
      });
    }, currentUser);

    await expect(orgClient.current()).resolves.toEqual(currentUser);
  });

  it('lists users', async () => {
    const response = [currentUser, otherUser];

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/users`);
      expect(init.method).toEqual('GET');
    }, response);

    await expect(client.list()).resolves.toEqual(response);
  });

  it('gets a user by id', async () => {
    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/users/usr_123456789`);
      expect(init.method).toEqual('GET');
    }, otherUser);

    await expect(client.get('usr_123456789')).resolves.toEqual(otherUser);
  });
});
