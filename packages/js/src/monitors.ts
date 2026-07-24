import HTTPClient from './httpClient.js';

export namespace monitors {
  export type MonitorType = 'Threshold' | 'MatchEvent' | 'AnomalyDetection';
  export type MonitorOperator = 'Below' | 'BelowOrEqual' | 'Above' | 'AboveOrEqual' | 'AboveOrBelow';

  export interface Monitor {
    id: string;
    createdAt: string;
    createdBy: string;
    name: string;
    type: MonitorType;
    description?: string;
    aplQuery?: string;
    mplQuery?: string;
    operator?: MonitorOperator;
    threshold?: number;
    alertOnNoData?: boolean;
    notifyByGroup?: boolean;
    resolvable?: boolean;
    notifierIds?: string[];
    /**
     * @deprecated Use `notifierIds` instead.
     */
    notifierIDs?: string[];
    intervalMinutes?: number;
    rangeMinutes?: number;
    disabled?: boolean;
    disabledUntil?: string;
    [key: string]: unknown;
  }

  export interface CreateRequest extends Omit<Monitor, 'id' | 'createdAt' | 'createdBy'> {}

  export interface UpdateRequest extends Omit<Monitor, 'id' | 'createdAt' | 'createdBy'> {}

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/monitors';

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getMonitors
     */
    list = (): Promise<Monitor[]> => this.client.get(this.localPath);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getMonitor
     */
    get = (id: string): Promise<Monitor> => this.client.get(this.localPath + '/' + id);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/createMonitor
     */
    create = (req: CreateRequest): Promise<Monitor> => this.client.post(this.localPath, { body: JSON.stringify(req) });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/updateMonitor
     */
    update = (id: string, req: UpdateRequest): Promise<Monitor> =>
      this.client.put(this.localPath + '/' + id, { body: JSON.stringify(req) });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/deleteMonitor
     */
    delete = (id: string): Promise<Response> => this.client.delete(this.localPath + '/' + id);
  }
}
