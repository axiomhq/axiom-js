import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export interface Token {
    id?: string;
    name: string;
    description?: string;
    scopes: Array<string>;
}

export interface RawToken {
    token: string;
    scopes: Array<string>;
}

class TokensService extends HTTPClient {
    protected readonly localPath: string;

    constructor(basePath: string, accessToken: string, localPath: string) {
        super(basePath, accessToken);

        this.localPath = localPath;
    }

    list = (): Promise<[Token]> =>
        this.client.get<[Token]>(this.localPath).then((response) => {
            return response.data;
        });

    get = (id: string): Promise<Token> =>
        this.client.get<Token>(this.localPath + '/' + id).then((response) => {
            return response.data;
        });

    view = (id: string): Promise<RawToken> =>
        this.client.get<RawToken>(this.localPath + '/' + id + '/token').then((response) => {
            return response.data;
        });

    create = (token: Token): Promise<Token> =>
        this.client.post<Token>(this.localPath, token).then((response) => {
            return response.data;
        });

    update = (id: string, token: Token): Promise<Token> =>
        this.client.put<Token>(this.localPath + '/' + id, token).then((response) => {
            return response.data;
        });

    delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);
}

export class IngestTokensService extends TokensService {
    constructor(basePath: string, accessToken: string) {
        super(basePath, accessToken, '/api/v1/tokens/ingest');
    }

    validate = (): Promise<boolean> =>
        this.client.get(this.localPath + '/validate').then((response) => {
            return response.status === 204;
        });
}

export class PersonalTokensService extends TokensService {
    constructor(basePath: string, accessToken: string) {
        super(basePath, accessToken, '/api/v1/tokens/personal');
    }
}
