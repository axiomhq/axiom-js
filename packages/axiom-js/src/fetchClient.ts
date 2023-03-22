import fetch from 'cross-fetch';
import fetchRetry, { RequestInitWithRetry } from 'fetch-retry';
import { parseLimitFromResponse, Limit, LimitType } from './limit';

export class FetchClient {
  constructor(public config: { headers: HeadersInit; baseUrl: string; timeout: number }) {}

  async doReq<T>(
    endpoint: string,
    method: string,
    init: RequestInitWithRetry = {},
    searchParams: { [key: string]: string } = {},
  ): Promise<T> {
    let finalUrl = `${this.config.baseUrl}${endpoint}`;
    const params = this._prepareSearchParams(searchParams);
    if (params) {
      finalUrl += `?${params.toString()}`;
    }

    const headers = { ...this.config.headers, ...init.headers };

    const resp = await fetchRetry(fetch)(finalUrl, {
      retries: 3,
      retryDelay: function (attempt, error, response) {
        return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
      },
      retryOn: [503, 502, 504, 500],
      headers,
      method,
      body: init.body ? init.body : undefined,
    });

    if (resp.status === 204) {
      return resp as T;
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

  constructor(public limit: Limit, public shortcircuit = false) {
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
