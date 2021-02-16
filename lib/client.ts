import axios, { AxiosInstance } from 'axios';

import { VersionService } from './version';

export const CloudURL = 'https://cloud.axiom.co';

export abstract class Client {
    basePath: string;
    accessToken: string;

    protected readonly client: AxiosInstance;

    constructor(basePath: string, accessToken: string) {
        this.basePath = basePath;
        this.accessToken = accessToken;

        this.client = axios.create({
            baseURL: basePath,
            headers: {
                accept: 'application/json',
                authorization: 'Bearer ' + accessToken,
                'content-type': 'application/json',
                'user-agent': 'axiom-node',
            },
            timeout: 30000,
        });
    }
}

export class AxiomClient {
    version: VersionService;

    constructor(basePath: string, accessToken: string) {
        this.version = new VersionService(basePath, accessToken);
    }
}
