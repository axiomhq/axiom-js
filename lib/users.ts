import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

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

export default class UsersService extends HTTPClient {
    private readonly localPath = '/api/v1/users';

    current = (): Promise<AuthenticatedUser> =>
        this.client.get<AuthenticatedUser>('/api/v1/user').then((response) => {
            return response.data;
        });

    list = (): Promise<[User]> =>
        this.client.get<[User]>(this.localPath).then((response) => {
            return response.data;
        });

    get = (id: string): Promise<User> =>
        this.client.get<User>(this.localPath + '/' + id).then((response) => {
            return response.data;
        });

    create = (user: CreateRequest): Promise<User> =>
        this.client.post<User>(this.localPath, user).then((response) => {
            return response.data;
        });

    update = (id: string, name: string): Promise<User> => {
        const req: UpdateRequest = { name: name };
        return this.client.put<User>(this.localPath + '/' + id, req).then((response) => {
            return response.data;
        });
    };

    updateRole = (id: string, role: Role): Promise<User> => {
        const req: UpdateRoleRequest = { role: role };
        return this.client.put<User>(this.localPath + '/' + id, req).then((response) => {
            return response.data;
        });
    };

    delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);
}
