import HTTPClient from './httpClient.js';

export namespace savedQueries {
  export interface SavedQuery {
    id: string;
    kind: 'apl';
    metadata: Record<string, unknown>;
    name: string;
    query: SavedQueryQuery;
    who: string;
    dataset?: string;
    [key: string]: unknown;
  }

  export interface SavedQueryQuery {
    apl: string;
    startTime?: string;
    endTime?: string;
    [key: string]: unknown;
  }

  export interface ListOptions {
    limit?: number;
    who?: string;
  }

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/apl-starred-queries';

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getStarredQueries
     */
    list = (options?: ListOptions): Promise<SavedQuery[]> => this.client.get(this.localPath, {}, options);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getStarred
     */
    get = (id: string): Promise<SavedQuery> => this.client.get(`${this.localPath}/${encodePath(id)}`);
  }
}
