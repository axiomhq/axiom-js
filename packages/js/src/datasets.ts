import HTTPClient, { resolveEdgeQueryUrl } from './httpClient.js';

export namespace datasets {
  export const TimestampField = '_time';
  export type DatasetKind = 'otel:metrics:v1' | 'otel:traces:v1' | 'otel:logs:v1' | 'axiom:events:v1';

  export interface Dataset {
    id: string;
    name: string;
    description: string;
    who: string;
    created: string;
    kind: DatasetKind;
    canWrite?: boolean;
    edgeDeployment?: string | null;
    mapFields?: string[] | null;
    region?: string;
    retentionDays?: number;
    sharedByOrg?: string;
    updatedAt?: string;
    useRetentionPeriod?: boolean;
  }

  export interface Field {
    name: string;
    type: string;
    description?: string;
    unit?: string;
    hidden?: boolean;
    [key: string]: unknown;
  }

  export type TrimResult = Response;

  export type MapFields = string[];

  export interface CreateRequest {
    name: string;
    description?: string;
    edgeDeployment?: string | null;
    kind?: DatasetKind;
    region?: string;
    retentionDays?: number;
    useRetentionPeriod?: boolean;
  }

  export interface CreateOptions {
    referrer?: string;
  }

  export interface UpdateRequest {
    description?: string;
    retentionDays?: number;
    useRetentionPeriod?: boolean;
  }

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

  interface TrimRequest {
    maxDuration: string;
  }

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/datasets';

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDatasets
     */
    list = (): Promise<Dataset[]> => this.client.get(this.localPath);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getDataset
     */
    get = (id: string): Promise<Dataset> => this.client.get(this.datasetPath(id));

    /**
     * @see https://axiom.co/docs/restapi/endpoints/createDataset
     */
    create = (req: CreateRequest, opts?: CreateOptions): Promise<Dataset> => {
      const params = new URLSearchParams();
      if (opts?.referrer) {
        params.set('referrer', opts.referrer);
      }
      const query = params.toString();
      const path = query ? `${this.localPath}?${query}` : this.localPath;
      return this.client.post(path, { body: JSON.stringify(req) });
    };

    /**
     * @see https://axiom.co/docs/restapi/endpoints/updateDataset
     */
    update = (id: string, req: UpdateRequest): Promise<Dataset> =>
      this.client.put(this.datasetPath(id), { body: JSON.stringify(req) });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/deleteDataset
     */
    delete = (id: string): Promise<Response> => this.client.delete(this.datasetPath(id));

    /**
     * @see https://axiom.co/docs/restapi/endpoints/trimDataset
     */
    trim = (id: string, maxDurationStr: string): Promise<TrimResult> => {
      // Go's 'time.Duration' uses nanoseconds as its base unit. So parse the
      // duration string and convert to nanoseconds. 1ms = 1000000ns.
      const req: TrimRequest = { maxDuration: maxDurationStr };
      return this.client.post(this.datasetPath(id) + '/trim', { body: JSON.stringify(req) });
    };

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getFieldsForDataset
     */
    fields = (dataset: string): Promise<Field[]> => this.client.get(this.datasetPath(dataset) + '/fields');

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getMapFields
     */
    mapFields = (dataset: string): Promise<MapFields> => this.client.get(this.datasetPath(dataset) + '/mapfields');

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

    private datasetPath = (dataset: string): string => this.localPath + '/' + encodePath(dataset);

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
