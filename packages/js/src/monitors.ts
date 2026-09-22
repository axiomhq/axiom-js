import {
  createMonitor,
  deleteMonitor,
  getMonitor,
  getMonitorHistory,
  getMonitors,
  updateMonitor,
} from './generated/v2/monitors/monitors.js';
import type {
  AlertHistory,
  GetMonitorParams,
  GetMonitorHistoryParams,
  GetMonitorsParams,
  MonitorBody,
  MonitorWithId,
  MonitorOperator as GeneratedMonitorOperator,
  MonitorType as GeneratedMonitorType,
} from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace monitors {
  export type MonitorType = GeneratedMonitorType;
  export type MonitorOperator = GeneratedMonitorOperator;

  export type Monitor = MonitorWithId;
  export type CreateRequest = MonitorBody;
  export type UpdateRequest = MonitorBody;

  export type HistoryEntry = AlertHistory;
  export type HistoryOptions = GetMonitorHistoryParams;
  export type ListOptions = GetMonitorsParams;
  export type GetOptions = GetMonitorParams;

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getMonitors
     */
    list = (options?: ListOptions): Promise<Monitor[]> => getMonitors(options, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getMonitor
     */
    get = (id: string, options?: GetOptions): Promise<Monitor> =>
      getMonitor(encodeURIComponent(id), options, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/createMonitor
     */
    create = (req: CreateRequest): Promise<Monitor> => createMonitor(req, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/updateMonitor
     */
    update = (id: string, req: UpdateRequest): Promise<Monitor> =>
      updateMonitor(encodeURIComponent(id), req, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/deleteMonitor
     */
    delete = (id: string): Promise<void> => deleteMonitor(encodeURIComponent(id), this.requestOptions());

    history = (id: string, options: HistoryOptions): Promise<HistoryEntry[]> =>
      getMonitorHistory(encodeURIComponent(id), options, this.requestOptions());
  }
}
