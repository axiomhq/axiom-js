import HTTPClient from './httpClient';

export namespace users {
    export interface User {
        id: string;
        name: string;
        emails: Array<string>;
    }

    export class Service extends HTTPClient {
        private readonly localPath = '/v1/users';

        current = (): Promise<User> =>
            this.client.get<User>('/v1/user').then((response) => {
                return response.data;
            });
    }
}
