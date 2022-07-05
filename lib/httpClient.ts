import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry, { isNetworkError, isRetryableError } from 'axios-retry';
import { Limit, LimitType, LimitScope, parseLimitFromResponse, limitKey } from './limit';

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
        // the reset time and return limit error.
        this.client.interceptors.request.use((config) => {
            return this.checkLimit(config);
        });

        this.client.interceptors.response.use(
            (response) => {
                const limit = parseLimitFromResponse(response);
                const key = limitKey(limit.type, limit.scope);
                this.limits[key] = limit;

                return response;
            },
            (error) => {
                // don't parse limit headers from shortcircut responses, as they
                // are fake responses
                if (error.shortcircuit) {
                    return Promise.reject(error);
                }
                
                const limit = parseLimitFromResponse(error.response);
                const key = limitKey(limit.type, limit.scope);
                this.limits[key] = limit;

                if (error.response.status == 429) {
                    return Promise.reject(new AxiomTooManyRequestsError(limit, error.response));
                }

                const message = error.response.data.message;
                if (message) {
                    return Promise.reject(new Error(message));
                }

                return Promise.reject(error);
            },
        );
    }

    checkLimit(config: AxiosRequestConfig) {
        let limitType = LimitType.api;
        if (config.url?.endsWith('/ingest')) {
            limitType = LimitType.ingest;
        } else if (config.url?.endsWith('/query') || config.url?.endsWith('/_apl')) {
            limitType = LimitType.query;
        }

        let limit = new Limit();
        let foundLimit = false;
        for (let scope of Object.values(LimitScope)) {
            const key = limitKey(limitType, scope);
            if (this.limits[key]) {
                limit = this.limits[key];
                foundLimit = true;
                break;
            }
        }

        // create fake response
        const now = new Date();
        const resetTimestap = Math.floor(now.getTime() / 1000);
        if (foundLimit && limit.remaining == 0 && resetTimestap < limit.reset) {
            config.adapter = (config) =>
                new Promise((_, reject) => {
                    const res: AxiosResponse = {
                        data: '',
                        status: 429,
                        statusText: 'Too Many Requests',
                        headers: { 'content-type': 'text/plain; charset=utf-8' },
                        config,
                        request: {},
                    };

                    return reject(new AxiomTooManyRequestsError(limit, res, true));
                });
        }

        return config;
    }
}

export class AxiomTooManyRequestsError extends Error {
    public message: string = '';

    constructor(public limit: Limit, public response: AxiosResponse, public shortcircuit = false) {
        super();
        var diffMins = Math.round(((limit.reset % 86400000) % 3600000) / 60000); // minutes
        var diffSecs = Math.round(diffMins / 60000); // minutes
        this.message = `${limit.type} limit exceeded, not making remote request, try again in ${diffMins}m${diffSecs}s`;
        if (limit.type == LimitType.api) {
            this.message = `${limit.scope} ` + this.message
        }
    }
}
