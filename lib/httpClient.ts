import axios, { AxiosInstance } from 'axios';

export default abstract class HTTPClient {
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
