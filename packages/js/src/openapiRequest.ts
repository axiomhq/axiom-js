import { FetchClient } from './fetchClient.js';

export interface OpenAPIRequestOptions extends RequestInit {
  axiomClient?: FetchClient;
}

declare global {
  interface Headers {
    entries(): IterableIterator<[string, string]>;
  }
}

/**
 * Routes generated v2 operations through the SDK's authenticated transport.
 */
export const openapiRequest = <T>(url: string, options: OpenAPIRequestOptions): Promise<T> => {
  const { axiomClient, ...requestInit } = options;
  if (!axiomClient) {
    throw new Error('Generated OpenAPI operations must be called through an Axiom service.');
  }

  return axiomClient
    .doReq<T | Response>(`/v2${url}`, requestInit.method ?? 'GET', requestInit)
    .then((result) => (result instanceof Response && result.status === 204 ? (undefined as T) : (result as T)));
};
