import 'whatwg-fetch';
import { Limit, LimitType } from './limit';
import fetchRetry, { RequestInitWithRetry } from 'fetch-retry';

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

class FetchClient {
    constructor(public config: { headers: HeadersInit, baseUrl: string; timeout: number }) {}

    async doReq<T>(endpoint: string, method: string, init: RequestInitWithRetry = {}, searchParams: {[key: string]: string} = {}): Promise<T | Response> {
        const params = new URLSearchParams();
        // searchParams.forEach((k: string) => {
        //     if (searchParams[k]) {
        //         params.append(k, searchParams[k])
        //     }
        // })
        const finalUrl = `${this.config.baseUrl}${endpoint}?${params.toString()}`;

        const headers = { ...this.config.headers, ...init.headers}

        const resp = await fetchRetry(fetch)(finalUrl, {
            retries: 3,
            retryDelay: function (attempt, error, response) {
                return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
            },
            retryOn: [503, 502, 504, 500],
            headers,
            method,
            body: init.body ? init.body : undefined,
        })

        if (resp.status === 401) {
            throw new Error(`Unauthorized`);
        } else if (resp.status === 204) {
            return resp;
        } else if (resp.status >= 400) {
            const payload = await resp.json()
            throw new Error(`Error ${resp.status} ${resp.statusText}: ${payload.message}`);
        }

        return await resp.json() as T
    }

    post<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T | Response> {
        return this.doReq<T>(url, 'POST', init, searchParams);
    }

    get<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T | Response> {
        return this.doReq<T>(url, 'GET', init, searchParams);
    }

    put<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T | Response> {
        return this.doReq<T>(url, 'PUT', init, searchParams);
    }

    delete<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T | Response> {
        return this.doReq<T>(url, 'DELETE', init, searchParams);
    }
}

export default abstract class HTTPClient {
    limits: { [key: string]: Limit } = {};
    protected readonly client: FetchClient;

    constructor(options: ClientOptions = {}) {
        const token = options.token || process.env.AXIOM_TOKEN || '';
        const url = options.url || process.env.AXIOM_URL || AxiomURL;
        const orgId = options.orgId || process.env.AXIOM_ORG_ID || '';

        const headers: HeadersInit = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
        };
        if (typeof window === 'undefined') {
            headers['User-Agent'] =  'axiom-js/' + Version;
        }
        if (orgId) {
            headers['X-Axiom-Org-Id'] = orgId;
        }

        this.client = new FetchClient({
            headers,
            baseUrl: url,
            timeout: 3000,
        });

        // this.client.interceptors.response.use(
        //     (response) => response,
        //     (error) => {
        //         // Some errors don't have a response (i.e. when unit-testing)
        //         if (error.response) {
        //             if (error.response.status == 429) {
        //                 const limit = parseLimitFromResponse(error.response);
        //                 const key = limitKey(limit.type, limit.scope);
        //                 this.limits[key] = limit;
        //                 return Promise.reject(new AxiomTooManyRequestsError(limit, error.response));
        //             }

        //             const message = error.response.data.message;
        //             if (message) {
        //                 return Promise.reject(new Error(message));
        //             }
        //         }

        //         return Promise.reject(error);
        //     },
        // );
    }

}

export class AxiomTooManyRequestsError extends Error {
    public message: string = '';

    constructor(public limit: Limit, public response: Response, public shortcircuit = false) {
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
