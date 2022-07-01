import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry, { isNetworkError, isRetryableError } from 'axios-retry';
import { Limit, LimitType, LimitScope, parseLimitFromResponse } from './limit';

const Version = require('../package.json').version;

export const CloudURL = 'https://cloud.axiom.co';

export default abstract class HTTPClient {
    protected readonly client: AxiosInstance;
    limits: {[key: string]: Limit} = {};

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
        this.client.defaults.headers.common['User-Agent'] = 'axiom-node/' + Version;
        this.client.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        if (orgID) {
            this.client.defaults.headers.common['X-Axiom-Org-Id'] = orgID;
        }

        // We should only retry in the case the status code is >= 500, anything below isn't worth retrying.
        axiosRetry(this.client, {
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error: any) => {
                return isNetworkError(error) || isRetryableError(error);
            },
        });

        // If we've hit the rate limit, don't make further requests before
        // the reset time.
        this.client.interceptors.request.use((config) => {
            return this.checkLimit(config);
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                const limit = parseLimitFromResponse(error.response);
                const limitKey = `${limit.scope}:${limit.type}`;
                this.limits[limitKey] = limit;

                const message = error.response.data.message;
                if (message) {
                    return Promise.reject(new Error(message));
                }

                return Promise.reject(error);
            },
        );
    }

    // https://github.com/axios/axios/issues/1666
    checkLimit(config: AxiosRequestConfig) {
        let limitType = LimitType.rate;
        if (config.url?.endsWith('/ingest')) {
            limitType = LimitType.ingest;
        } else if (config.url?.endsWith('/query') || config.url?.endsWith('/_apl')) {
            limitType = LimitType.query;
        }

        let limit: Limit = {
            scope: LimitScope.unknown,
            type: limitType,
            value: 0,
            remaining: -1,
            reset: 0,
        };
        let foundLimit = false;
        for (let scope of Object.values(LimitScope)) {
            const key = `${scope}:${limitType}`;
            if (this.limits[key]) {
                limit = this.limits[key];
                foundLimit = true;
                break;
            }
            
        }

        // create fake response
        const now = new Date();
        const timestampInSeconds = Math.floor(now.getTime() / 1000);
        if (foundLimit && limit.remaining == 0 && timestampInSeconds < limit.reset) {
            config.adapter = (config) =>
                new Promise((_, reject) => {
                    const res: AxiosResponse = {
                        data: `${limit.scope} ${limitType.toString()} limit exceeded, not making remote request`,
                        status: 499,
                        statusText: 'Rate Limit Exceeded',
                        headers: { 'content-type': 'text/plain; charset=utf-8' },
                        config,
                        request: {},
                    };

                    return reject({response: res});
                });
        }

        return config;
    }
}
