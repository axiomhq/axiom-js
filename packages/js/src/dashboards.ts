import {
  createDashboard,
  deleteDashboard,
  getDashboard,
  listDashboards,
  patchDashboardChart,
  updateDashboard,
} from './generated/v2/dashboards/dashboards.js';
import type {
  DashboardChartPatchRequest,
  Dashboard as GeneratedDashboard,
  DashboardResource as GeneratedDashboardResource,
  DashboardUpsertRequest,
  DashboardWriteResponse,
  GetDashboardParams,
  ListDashboardsParams,
} from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace dashboards {
  export type DashboardDocument = GeneratedDashboard;
  export type DashboardResource = GeneratedDashboardResource;

  export type ListOptions = ListDashboardsParams;
  export type GetOptions = GetDashboardParams;

  export type UpsertRequest = DashboardUpsertRequest;
  export type WriteResponse = DashboardWriteResponse;
  export type ChartPatchRequest = DashboardChartPatchRequest;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDashboards
     */
    list = (options?: ListOptions): Promise<DashboardResource[]> => listDashboards(options, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDashboard
     */
    get = (uid: string, options?: GetOptions): Promise<DashboardResource> =>
      getDashboard(encodePath(uid), options, this.requestOptions());

    create = (request: UpsertRequest): Promise<WriteResponse> => createDashboard(request, this.requestOptions());

    update = (uid: string, request: UpsertRequest): Promise<WriteResponse> =>
      updateDashboard(encodePath(uid), request, this.requestOptions());

    delete = (uid: string): Promise<void> => deleteDashboard(encodePath(uid), this.requestOptions());

    patchChart = (uid: string, chartId: string, request: ChartPatchRequest): Promise<WriteResponse> =>
      patchDashboardChart(encodePath(uid), encodePath(chartId), request, this.requestOptions());
  }
}
