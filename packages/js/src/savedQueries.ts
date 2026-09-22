import {
  createStarred,
  deleteStarred,
  getStarred,
  getStarredQueries,
  updateStarred,
} from './generated/v2/starred/starred.js';
import type {
  APLRequestWithOptions,
  GetStarredQueriesParams,
  StarredQueryBody,
  StarredQueryWithId,
} from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace savedQueries {
  export type SavedQuery = StarredQueryWithId;
  export type SavedQueryQuery = APLRequestWithOptions;
  export type ListOptions = GetStarredQueriesParams;
  export type CreateRequest = StarredQueryBody;
  export type UpdateRequest = StarredQueryBody;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getStarredQueries
     */
    list = (options?: ListOptions): Promise<SavedQuery[]> => getStarredQueries(options, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getStarred
     */
    get = (id: string): Promise<SavedQuery> => getStarred(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<SavedQuery> => createStarred(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<SavedQuery> =>
      updateStarred(encodePath(id), request, this.requestOptions());

    delete = (id: string): Promise<void> => deleteStarred(encodePath(id), this.requestOptions());
  }
}
