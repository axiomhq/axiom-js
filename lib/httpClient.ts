import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

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

        // We should only retry in the case the status code is >= 500, anything below isn't worth retrying.
        axiosRetry(this.client, {
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error: any) => {
                return error.response.status >= 500;
            },
        })

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
