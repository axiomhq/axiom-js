import {
  createDataset,
  createMapField,
  deleteDataset,
  deleteDatasetFields,
  deleteFieldForDataset,
  deleteMapField,
  getDataset,
  getDatasets,
  getFieldForDataset,
  getFieldsForDataset,
  getMapFields,
  trimDataset,
  updateDataset,
  updateFieldForDataset,
  updateMapFields,
  vacuumDataset,
} from './generated/v2/datasets/datasets.js';
import type {
  CreateDataset as GeneratedCreateDataset,
  CreateDatasetParams,
  Dataset as GeneratedDataset,
  DatasetField,
  DatasetKind as GeneratedDatasetKind,
  DeleteDatasetFieldsRequest,
  DeleteDatasetFieldsResult,
  GetDatasetParams,
  GetDatasetsParams,
  JobCreateResponse,
  MapField as GeneratedMapField,
  MapFields as GeneratedMapFields,
  TrimOptions,
  UpdateDataset,
} from './generated/v2/client.schemas.js';
import HTTPClient, { resolveEdgeQueryUrl } from './httpClient.js';

export namespace datasets {
  export const TimestampField = '_time';
  export type DatasetKind = GeneratedDatasetKind;
  export type Dataset = GeneratedDataset;
  export type Field = DatasetField;

  export type MapFields = GeneratedMapFields;

  export type MapField = GeneratedMapField;

  export type CreateRequest = GeneratedCreateDataset;
  export type CreateOptions = CreateDatasetParams;
  export type ListOptions = GetDatasetsParams;
  export type GetOptions = GetDatasetParams;
  export type UpdateRequest = UpdateDataset;
  export type DeleteFieldsRequest = DeleteDatasetFieldsRequest;
  export type DeleteFieldsResult = DeleteDatasetFieldsResult;
  export type Job = JobCreateResponse;

  export interface MetricsInfoOptions {
    start: string;
    end: string;
    edge?: string;
    edgeUrl?: string;
    edgeDeployment?: string | null;
    accept?: string;
  }

  export interface MetricInfo {
    temporality: string;
    type: string;
    unit: string | null;
    [key: string]: unknown;
  }

  export type MetricsInfo = Record<string, MetricInfo>;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasets
     */
    list = (options?: ListOptions): Promise<Dataset[]> => getDatasets(options, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDataset
     */
    get = (id: string, options?: GetOptions): Promise<Dataset> =>
      getDataset(encodePath(id), options, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/createDataset
     */
    create = (req: CreateRequest, opts?: CreateOptions): Promise<Dataset> =>
      createDataset(req, opts, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/updateDataset
     */
    update = (id: string, req: UpdateRequest): Promise<Dataset> =>
      updateDataset(encodePath(id), req, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/deleteDataset
     */
    delete = (id: string): Promise<Job> => deleteDataset(encodePath(id), this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/trimDataset
     */
    trim = (id: string, maxDurationStr: string): Promise<Job> => {
      const req: TrimOptions = { maxDuration: maxDurationStr };
      return trimDataset(encodePath(id), req, this.requestOptions());
    };

    vacuum = (id: string): Promise<void> => vacuumDataset(encodePath(id), this.requestOptions());

    deleteFields = (dataset: string, request: DeleteFieldsRequest): Promise<DeleteFieldsResult> =>
      deleteDatasetFields(encodePath(dataset), request, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getFieldsForDataset
     */
    fields = (dataset: string): Promise<Field[]> => getFieldsForDataset(encodePath(dataset), this.requestOptions());

    field = (dataset: string, field: string): Promise<Field> =>
      getFieldForDataset(encodePath(dataset), encodePath(field), this.requestOptions());

    updateField = (dataset: string, field: string, request: Field): Promise<Field> =>
      updateFieldForDataset(encodePath(dataset), encodePath(field), request, this.requestOptions());

    deleteField = (dataset: string, field: string): Promise<DeleteFieldsResult> =>
      deleteFieldForDataset(encodePath(dataset), encodePath(field), this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getMapFields
     */
    mapFields = (dataset: string): Promise<MapFields> => getMapFields(encodePath(dataset), this.requestOptions());

    updateMapFields = (dataset: string, request: MapFields): Promise<MapFields> =>
      updateMapFields(encodePath(dataset), request, this.requestOptions());

    createMapField = (dataset: string, request: MapField): Promise<MapField> =>
      createMapField(encodePath(dataset), request, this.requestOptions());

    deleteMapField = (dataset: string, name: string): Promise<void> =>
      deleteMapField(encodePath(dataset), encodePath(name), this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasetMetrics
     */
    metrics = (dataset: string, options: MetricsInfoOptions): Promise<MetricsInfo> =>
      this.getMetricsInfo(`datasets/${encodePath(dataset)}/metrics`, options);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasetMetricTags
     */
    metricTags = (dataset: string, metric: string, options: MetricsInfoOptions): Promise<string[]> =>
      this.getMetricsInfo(`datasets/${encodePath(dataset)}/metrics/${encodePath(metric)}/tags`, options);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasetMetricTagValues
     */
    metricTagValues = (dataset: string, metric: string, tag: string, options: MetricsInfoOptions): Promise<string[]> =>
      this.getMetricsInfo(
        `datasets/${encodePath(dataset)}/metrics/${encodePath(metric)}/tags/${encodePath(tag)}/values`,
        options,
      );

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasetTags
     */
    metricDatasetTags = (dataset: string, options: MetricsInfoOptions): Promise<string[]> =>
      this.getMetricsInfo(`datasets/${encodePath(dataset)}/tags`, options);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasetTagValues
     */
    metricDatasetTagValues = (dataset: string, tag: string, options: MetricsInfoOptions): Promise<string[]> =>
      this.getMetricsInfo(`datasets/${encodePath(dataset)}/tags/${encodePath(tag)}/values`, options);

    private getMetricsInfo = async <T>(path: string, options: MetricsInfoOptions): Promise<T> => {
      const init: RequestInit = options.accept ? { headers: { Accept: options.accept } } : {};

      return this.client.get<T>(
        resolveEdgeQueryUrl(
          this.clientOptions,
          options,
          `/v1/query/metrics/info/${path.replace(/^\/+/, '')}`,
          'metrics metadata requests',
        ),
        init,
        { start: options.start, end: options.end },
        undefined,
        true,
      );
    };
  }
}
