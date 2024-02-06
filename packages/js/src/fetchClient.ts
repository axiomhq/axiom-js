import fetchRetry, { RequestInitWithRetry } from 'fetch-retry';
import { parseLimitFromResponse, Limit, LimitType } from './limit.js';

export class FetchClient {
  constructor(public config: { headers: HeadersInit; baseUrl: string; timeout: number }) {}

  async doReq<T>(
    endpoint: string,
    method: string,
    init: RequestInitWithRetry = {},
    searchParams: { [key: string]: string } = {}
  ): Promise<{ data: T; status: number }> {
    let finalUrl = `${this.config.baseUrl}${endpoint}`;
    const params = this.prepareSearchParams(searchParams);
    if (params) {
      finalUrl += `?${params}`;
    }

    const headers = { ...this.config.headers, ...init.headers };

    const resp = await fetchRetry(fetch)(finalUrl, {
      retries: 3,
      retryDelay: (attempt, error, response) => Math.pow(2, attempt) * 1000,
      retryOn: [503, 502, 504, 500],
      headers,
      method,
      body: init.body ? JSON.stringify(init.body) : undefined,
      ...init,
    });

    return this._handleResponse<T>(resp);
  }

  private async _handleResponse<T>(resp: Response): Promise<{ data: T; status: number }> {
    if (resp.ok) {
      let data: T = null as any;
      if (!(resp.status === 204 || resp.headers.get('Content-Length') === '0')) {
        data = await resp.json();
      }
      return { data, status: resp.status };
    } else {
      if (resp.status === 429) {
        const limit = parseLimitFromResponse(resp);
        throw new AxiomTooManyRequestsError(limit);
      } else {
        if (resp.headers.get('Content-Length') !== '0') {
          const errorBody = await resp.json();
          const errorMessage = errorBody.message || resp.statusText;
          throw new Error(`Error ${resp.status}: ${errorMessage}`);
        } else {
          throw new Error(`Error ${resp.status}: ${resp.statusText}`);
        }
      }
    }
  }

  private prepareSearchParams(searchParams: { [key: string]: string }): string {
    const cleanedParams = Object.fromEntries(Object.entries(searchParams).filter(([, value]) => value));
    const params = new URLSearchParams(cleanedParams);
    return params.toString();
  }

  post<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<{ data: T; status: number }> {
    return this.doReq<T>(url, 'POST', init, searchParams);
  }

  get<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<{ data: T; status: number }> {
    return this.doReq<T>(url, 'GET', init, searchParams);
  }

  put<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<{ data: T; status: number }> {
    return this.doReq<T>(url, 'PUT', init, searchParams);
  }

  delete<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<{ data: T; status: number }> {
    return this.doReq<T>(url, 'DELETE', init, searchParams);
  }
}

// Custom error class for handling 429 Too Many Requests error.
export class AxiomTooManyRequestsError extends Error {
  constructor(public limit: Limit, public shortcircuit = false) {
    super(`Error: ${limit.type} limit exceeded. Try again later.`);
    Object.setPrototypeOf(this, AxiomTooManyRequestsError.prototype); // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    const retryIn = AxiomTooManyRequestsError.timeUntilReset(limit);
    this.message = `${limit.type} limit exceeded, try again in ${retryIn.minutes}m${retryIn.seconds}s`;
    if (limit.type === LimitType.api) {
      this.message = `${limit.scope} ` + this.message;
    }
  }

  static timeUntilReset(limit: Limit) {
    const now = new Date().getTime();
    const resetTime = limit.reset.getTime();
    const total = resetTime - now;
    return {
      minutes: Math.floor(total / 60000),
      seconds: Math.floor((total % 60000) / 1000),
    };
  }
}
