import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry, { isNetworkError, isRetryableError } from 'axios-retry';
import { Limit, LimitType, LimitScope, parseLimitFromResponse, limitKey } from './limit';

export const CloudURL = 'https://cloud.axiom.co';

export interface ClientOptions {
    token?: string;
    url?: string;
    orgId?: string;
}

export default abstract class HTTPClient {
    protected readonly client: AxiosInstance;
    limits: { [key: string]: Limit } = {};

    constructor(options: ClientOptions = {}) {
        const token = options.token || process.env.AXIOM_TOKEN || '';
        const url = options.url || process.env.AXIOM_URL || CloudURL;
        const orgId = options.orgId || process.env.AXIOM_ORG_ID || '';

        this.client = axios.create({
            baseURL: url,
            timeout: 30000,
        });

        this.client.defaults.headers.common['Accept'] = 'application/json';
        this.client.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        if (orgId) {
            this.client.defaults.headers.common['X-Axiom-Org-Id'] = orgId;
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

                // Some errors don't have a response (i.e. when unit-testing)
                if (error.response) {
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
        const currentTime = new Date().getTime();
        if (foundLimit && limit.remaining == 0 && currentTime < limit.reset.getTime()) {
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
        const retryIn = this.timeUntilReset();
        this.message = `${limit.type} limit exceeded, not making remote request, try again in ${retryIn.minutes}m${retryIn.seconds}s`;
        if (limit.type == LimitType.api) {
            this.message = `${limit.scope} ` + this.message;
        }
    }

    timeUntilReset() {
        const total = this.limit.reset.getTime() - new Date().getTime();
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);

        return {
            total,
            minutes,
            seconds,
        };
    }
}
