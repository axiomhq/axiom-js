import fetchRetry, { RequestInitWithRetry } from 'fetch-retry';
import { parseLimitFromResponse, Limit, LimitType } from './limit.js';

export class FetchClient {
  constructor(public config: { headers: HeadersInit; baseUrl: string; timeout: number }) {}

  async doReq<T>(
    endpoint: string,
    method: string,
    init: RequestInitWithRetry = {},
    searchParams: { [key: string]: string } = {}
  ): Promise<T> {
    let finalUrl = `${this.config.baseUrl}${endpoint}`;
    const params = this.prepareSearchParams(searchParams);
    if (params) {
      finalUrl += `?${params}`;
    }

    const headers = { ...this.config.headers, ...init.headers };

    const resp = await fetchRetry(fetch)(finalUrl, {
      retries: 3,
      retryDelay: (attempt, error, response) => Math.pow(2, attempt) * 1000, // 1000, 2000, 4000
      retryOn: [503, 502, 504, 500], // Retry on these HTTP status codes
      headers,
      method,
      body: init.body ? JSON.stringify(init.body) : undefined, // Ensure body is stringified
      ...init,
    });

    return this._handleResponse<T>(resp);
  }

  private async _handleResponse<T>(resp: Response): Promise<T> {
    if (resp.ok) {
      return (await resp.json()) as T;
    } else if (resp.status === 204) {
      return resp as unknown as T; // Handle no-content responses
    } else if (resp.status === 429) {
      const limit = parseLimitFromResponse(resp);
      throw new AxiomTooManyRequestsError(limit);
    } else {
      const errorMessage = await resp.text();
      throw new Error(`Error ${resp.status}: ${errorMessage}`);
    }
  }

  private prepareSearchParams(searchParams: { [key: string]: string }): string {
    for (const key in searchParams) {
      if (!searchParams[key]) {
        delete searchParams[key];
      }
    }

    const params = new URLSearchParams(searchParams);
    return params.toString();
  }

  post<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T> {
    return this.doReq<T>(url, 'POST', init, searchParams);
  }

  get<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T> {
    return this.doReq<T>(url, 'GET', init, searchParams);
  }

  put<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T> {
    return this.doReq<T>(url, 'PUT', init, searchParams);
  }

  delete<T>(url: string, init: RequestInitWithRetry = {}, searchParams: any = {}): Promise<T> {
    return this.doReq<T>(url, 'DELETE', init, searchParams);
  }
}

// Custom error class for handling requests (429) error.
export class AxiomTooManyRequestsError extends Error {
  constructor(public limit: Limit, public shortcircuit = false) {
    super();
    Object.setPrototypeOf(this, AxiomTooManyRequestsError.prototype); // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    const retryIn = AxiomTooManyRequestsError.timeUntilReset(limit);
    this.message = `${limit.type} limit exceeded, try again in ${retryIn.minutes}m${retryIn.seconds}s`;
    if (limit.type === LimitType.api) {
      this.message = `${limit.scope} ` + this.message;
    }
  }

  static timeUntilReset(limit: Limit) {
    const total = limit.reset.getTime() - new Date().getTime();
    return {
      minutes: Math.floor(total / 60000),
      seconds: Math.floor((total % 60000) / 1000),
    };
  }
}