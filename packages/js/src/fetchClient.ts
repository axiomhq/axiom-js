import fetchRetry from 'fetch-retry';
import { parseLimitFromResponse, Limit, LimitType } from './limit.js';

export class FetchClient {
  constructor(public config: { headers: HeadersInit; baseUrl: string; timeout: number }) {}

  async doReq<T>(
    endpoint: string,
    method: string,
    init: RequestInit = {},
    searchParams: { [key: string]: string } = {},
    timeout = this.config.timeout,
  ): Promise<T> {
    let finalUrl = `${this.config.baseUrl}${endpoint}`;
    const params = this._prepareSearchParams(searchParams);
    if (params) {
      finalUrl += `?${params.toString()}`;
    }

    const headers = { ...this.config.headers, ...init.headers };

    const resp = await fetchRetry(fetch)(finalUrl, {
      retries: 1,
      retryDelay: function (attempt, error, response) {
        return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
      },
      retryOn: [503, 502, 504, 500],
      headers,
      method,
      body: init.body ? init.body : undefined,
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store',
    });

    if (resp.status === 204) {
      return resp as unknown as T;
    } else if (resp.status == 429) {
      const limit = parseLimitFromResponse(resp);

      return Promise.reject(new AxiomTooManyRequestsError(limit));
    } else if (resp.status === 401) {
      return Promise.reject(new Error('Forbidden'));
    } else if (resp.status >= 400) {
      const payload = (await resp.json()) as { message: string };
      return Promise.reject(new Error(payload.message));
    }

    return (await resp.json()) as T;
  }

  post<T>(url: string, init: RequestInit = {}, searchParams: any = {}, timeout = this.config.timeout): Promise<T> {
    return this.doReq<T>(url, 'POST', init, searchParams, timeout);
  }

  get<T>(url: string, init: RequestInit = {}, searchParams: any = {}, timeout = this.config.timeout): Promise<T> {
    return this.doReq<T>(url, 'GET', init, searchParams, timeout);
  }

  put<T>(url: string, init: RequestInit = {}, searchParams: any = {}, timeout = this.config.timeout): Promise<T> {
    return this.doReq<T>(url, 'PUT', init, searchParams, timeout);
  }

  delete<T>(url: string, init: RequestInit = {}, searchParams: any = {}, timeout = this.config.timeout): Promise<T> {
    return this.doReq<T>(url, 'DELETE', init, searchParams, timeout);
  }

  _prepareSearchParams = (searchParams: { [key: string]: string }) => {
    const params = new URLSearchParams();
    let hasParams = false;

    Object.keys(searchParams).forEach((k: string) => {
      if (searchParams[k]) {
        params.append(k, searchParams[k]);
        hasParams = true;
      }
    });

    return hasParams ? params : null;
  };
}

export class AxiomTooManyRequestsError extends Error {
  public message: string = '';

  constructor(
    public limit: Limit,
    public shortcircuit = false,
  ) {
    super();
    Object.setPrototypeOf(this, AxiomTooManyRequestsError.prototype); // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    const retryIn = AxiomTooManyRequestsError.timeUntilReset(limit);
    this.message = `${limit.type} limit exceeded, try again in ${retryIn.minutes}m${retryIn.seconds}s`;
    if (limit.type == LimitType.api) {
      this.message = `${limit.scope} ` + this.message;
    }
  }

  static timeUntilReset(limit: Limit) {
    const total = limit.reset.getTime() - new Date().getTime();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);

    return {
      total,
      minutes,
      seconds,
    };
  }
}
