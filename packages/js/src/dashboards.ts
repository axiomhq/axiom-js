import HTTPClient from './httpClient.js';

export namespace dashboards {
  export type DashboardDocument = Record<string, unknown>;

  export interface DashboardResource {
    id?: string;
    uid: string;
    dashboard: DashboardDocument;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
    version?: number;
    [key: string]: unknown;
  }

  export interface ListOptions {
    limit?: number;
    offset?: number;
  }

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/dashboards';

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDashboards
     */
    list = (options?: ListOptions): Promise<DashboardResource[]> => this.client.get(this.localPath, {}, options);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDashboard
     */
    get = (uid: string): Promise<DashboardResource> => this.client.get(`${this.localPath}/uid/${encodePath(uid)}`);
  }
}
