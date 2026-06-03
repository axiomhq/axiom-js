import HTTPClient from './httpClient.js';

export namespace users {
  export interface User {
    id: string;
    name: string;
    emails: Array<string>;
  }

  export class Service extends HTTPClient {
    /**
     * @see https://axiom.co/docs/restapi/endpoints/getCurrentUser
     */
    current = (): Promise<User> => this.client.get('/v1/user');
  }
}
