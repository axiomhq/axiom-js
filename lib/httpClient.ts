import axios, { AxiosInstance } from 'axios';

export const CloudURL = 'https://cloud.axiom.co';

export default abstract class HTTPClient {
    protected readonly client: AxiosInstance;

    constructor(
        basePath: string = process.env.AXIOM_URL || CloudURL,
        accessToken: string = process.env.AXIOM_TOKEN || '',
        orgID: string = process.env.AXIOM_ORG_ID || '',
    ) {
        this.client = axios.create({
            baseURL: basePath,
            timeout: 30000,
        });

        this.client.defaults.headers.common['Accept'] = 'application/json';
        this.client.defaults.headers.common['User-Agent'] = 'axiom-node';
        this.client.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        if (orgID) {
            this.client.defaults.headers.common['X-Axiom-Org-Id'] = orgID;
        }

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
