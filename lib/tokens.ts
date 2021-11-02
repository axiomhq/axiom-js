import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';
export namespace tokens {
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

    class Service extends HTTPClient {
        protected readonly localPath: string;

        constructor(localPath: string, basePath?: string, accessToken?: string, orgID?: string) {
            super(basePath, accessToken, orgID);

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

    export class IngestService extends Service {
        constructor(basePath?: string, accessToken?: string, orgID?: string) {
            super('/api/v1/tokens/ingest', basePath, accessToken, orgID);
        }

        validate = (): Promise<boolean> =>
            this.client.get(this.localPath + '/validate').then((response) => {
                return response.status === 204;
            });
    }

    export class PersonalService extends Service {
        constructor(basePath?: string, accessToken?: string, orgID?: string) {
            super('/api/v1/tokens/personal', basePath, accessToken, orgID);
        }
    }
}
