import HTTPClient from './httpClient.js';

export namespace users {
  const encodePath = (value: string): string => encodeURIComponent(value);

  export interface UserRole {
    id: string;
    name: string;
    [key: string]: unknown;
  }

  export interface User {
    id: string;
    name: string;
    emails?: string[];
    email?: string;
    role?: UserRole | null;
    [key: string]: unknown;
  }

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/users';

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getCurrentUser
     */
    current = (): Promise<User> => this.client.get('/v2/user');

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getUsers
     */
    list = (): Promise<User[]> => this.client.get(this.localPath);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getUser
     */
    get = (id: string): Promise<User> => this.client.get(`${this.localPath}/${encodePath(id)}`);
  }
}
