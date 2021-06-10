import axios, { AxiosInstance } from 'axios';

export default abstract class HTTPClient {
    protected readonly client: AxiosInstance;

    constructor(basePath: string, accessToken: string) {
        this.client = axios.create({
            baseURL: basePath,
            headers: {
                accept: 'application/json',
                authorization: 'Bearer ' + accessToken,
                'user-agent': 'axiom-node',
            },
            timeout: 30000,
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                const message = error.response.data.message;
                if (message) {
                    return Promise.reject(new Error(message));
                }

                return Promise.reject(error);
            },
        );
    }
}
