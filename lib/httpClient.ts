import axios, { AxiosInstance } from 'axios';

export default abstract class HTTPClient {
    protected readonly client: AxiosInstance;

    constructor(basePath: string, accessToken: string) {
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
