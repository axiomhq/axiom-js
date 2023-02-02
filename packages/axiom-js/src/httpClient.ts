import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults } from 'axios';
import axiosRetry, { isNetworkError, isRetryableError } from 'axios-retry';
import { Limit, LimitType, LimitScope, parseLimitFromResponse, limitKey } from './limit';

declare global {
    var EdgeRuntime: string;
}

const Version = require('../package.json').version;
const AxiomURL = 'https://api.axiom.co';

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
        const url = options.url || process.env.AXIOM_URL || AxiomURL;
        const orgId = options.orgId || process.env.AXIOM_ORG_ID || '';

        const axiosOptions: CreateAxiosDefaults = {
            baseURL: url,
            timeout: 30000,
        };

        // detect if runnig in edge runtime
        // axios fails to run on edge runtime due to missing http adapter, until
        // this bug is fixed we need to use fetch instead
        if (
            typeof window === 'undefined' &&
            ((globalThis.EdgeRuntime && globalThis.EdgeRuntime !== 'undefined') || process.env.NEXT_RUNTIME === 'edge')
        ) {
            axiosOptions.adapter = function (config) {
                return new Promise(async (resolve, reject) => {
                    try {
                        const headers: HeadersInit = [
                            ['Content-Type', config.headers!['Content-Type'] as string],
                            ['Authorization', config.headers!['Authorization'] as string],
                            ['X-Axiom-Org-Id', config.headers!['X-Axiom-Org-Id'] as string],
                            ['User-Agent', config.headers!['User-Agent'] as string],
                            ['Accept', config.headers!['Accept'] as string],
                        ];

                        const reqOptions: RequestInit = {
                            method: config.method,
                            keepalive: true,
                            headers,
                            body: config.data,
                            // TODO: add config params to request
                            // params: config.params,
                        };
                        const resp = await fetch(config.baseURL + config.url!.toString(), reqOptions);
                        const payload = await resp.text();
                        const response: AxiosResponse = {
                            data: payload,
                            status: resp.status,
                            statusText: resp.statusText,
                            headers: {
                                'content-type': resp.headers.get('content-type') || undefined,
                            },
                            config: config,
                        };
                        resolve(response);
                    } catch (err: any) {
                        console.log({ err });
                        const axiosErr = new AxiosError(err.message);
                        reject(axiosErr);
                    }
                });
            };
        }

        this.client = axios.create(axiosOptions);

        this.client.defaults.headers.common['Accept'] = 'application/json';
        // if not in browser, set user agent
        if (typeof window === 'undefined') {
            this.client.defaults.headers.common['User-Agent'] = 'axiom-js/' + Version;
        }
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

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                // Some errors don't have a response (i.e. when unit-testing)
                if (error.response) {
                    if (error.response.status == 429) {
                        const limit = parseLimitFromResponse(error.response);
                        const key = limitKey(limit.type, limit.scope);
                        this.limits[key] = limit;
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
