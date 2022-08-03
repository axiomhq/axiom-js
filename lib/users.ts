import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export namespace users {
    export interface User {
        id: string;
        email: string;
        name: string;
        role: Role;
        permissions: Array<string>;
    }

    export interface AuthenticatedUser {
        id: string;
        name: string;
        emails: Array<string>;
    }

    export interface CreateRequest {
        name: string;
        email: string;
        role: Role;
        teamIds?: Array<string>;
    }

    export enum Role {
        Owner = 'owner',
        Admin = 'admin',
        User = 'user',
        ReadOnly = 'read-only',
    }

    interface UpdateRequest {
        name: string;
    }
    interface UpdateRoleRequest {
        role: Role;
    }

    export class Service extends HTTPClient {
        private readonly localPath = '/api/v1/users';

        current = (): Promise<AuthenticatedUser> =>
            this.client.get<AuthenticatedUser>('/api/v1/user').then((response) => {
                return response.data;
            });

        get = (id: string): Promise<User> =>
            this.client.get<User>(this.localPath + '/' + id).then((response) => {
                return response.data;
            });
    }
}
