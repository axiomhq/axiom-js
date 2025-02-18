import HTTPClient from './httpClient.js';

export namespace monitors {
  export type MonitorType = 'Threshold' | 'MatchEvent';
  export type MonitorOperator = 'Below' | 'BelowOrEqual' | 'Above' | 'AboveOrEqual';

  export interface Monitor {
    id: string;
    createdAt: string;
    createdBy: string;
    name: string;
    type: MonitorType;
    description?: string;
    aplQuery: string;
    operator: MonitorOperator;
    threshold: number;
    alertOnNoData: boolean;
    notifyByGroup: boolean;
    resolvable?: boolean;
    notifierIDs: string[];
    intervalMinutes: number;
    rangeMinutes: number;
    disabled?: boolean;
    disabledUntil?: string;
  }

  export interface CreateRequest extends Omit<Monitor, 'id' | 'createdAt' | 'createdBy'> {}

  export interface UpdateRequest extends Omit<Monitor, 'id' | 'createdAt' | 'createdBy'> {}

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/monitors';

    list = (): Promise<Monitor[]> => this.client.get(this.localPath);

    get = (id: string): Promise<Monitor> => this.client.get(this.localPath + '/' + id);

    create = (req: CreateRequest): Promise<Monitor> => this.client.post(this.localPath, { body: JSON.stringify(req) });

    update = (id: string, req: UpdateRequest): Promise<Monitor> =>
      this.client.put(this.localPath + '/' + id, { body: JSON.stringify(req) });

    delete = (id: string): Promise<Response> => this.client.delete(this.localPath + '/' + id);
  }
}
