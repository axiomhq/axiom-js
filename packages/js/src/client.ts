import { datasets } from './datasets';
import { users } from './users';
import HTTPClient, { ClientOptions } from './httpClient';

export class Client extends HTTPClient {
  datasets: datasets.Service;
  users: users.Service;
  localPath = '/v1';

  constructor(options?: ClientOptions) {
    super(options);
    this.datasets = new datasets.Service(options);
    this.users = new users.Service(options);
  }

  ingest = (
    id: string,
    data: string | Buffer | ReadableStream,
    contentType: ContentType = ContentType.JSON,
    contentEncoding: ContentEncoding = ContentEncoding.Identity,
    options?: IngestOptions,
  ): Promise<IngestStatus> =>
    this.client.post(
      this.localPath + '/datasets/' + id + '/ingest',
      {
        headers: {
          'Content-Type': contentType,
          'Content-Encoding': contentEncoding,
        },
        body: data,
      },
      {
        'timestamp-field': options?.timestampField as string,
        'timestamp-format': options?.timestampFormat as string,
        'csv-delimiter': options?.csvDelimiter as string,
      },
    );

  ingestBuffer = (
    id: string,
    buffer: Buffer,
    contentType: ContentType,
    contentEncoding: ContentEncoding,
    options?: IngestOptions,
  ): Promise<IngestStatus> => this.ingest(id, buffer, contentType, contentEncoding, options);

  // TODO: sending gzip doesn't work on edge runtime
  ingestEvents = async (id: string, events: Array<object> | object, options?: IngestOptions): Promise<IngestStatus> => {
    const array = Array.isArray(events) ? events : [events];
    const json = array.map((v) => JSON.stringify(v)).join('\n');
    return this.ingest(id, json, ContentType.NDJSON, ContentEncoding.Identity, options);
  };

  queryLegacy = (id: string, query: QueryLegacy, options?: QueryOptions): Promise<QueryLegacyResult> =>
    this.client.post(
      this.localPath + '/datasets/' + id + '/query',
      {
        body: JSON.stringify(query),
      },
      {
        'streaming-duration': options?.streamingDuration as string,
        nocache: options?.noCache as boolean,
      },
    );

  query = (apl: string, options?: QueryOptions): Promise<QueryResult> => {
    const req: Query = { apl: apl };
    if (options?.startTime) {
      req.startTime = options?.startTime;
    }
    if (options?.endTime) {
      req.endTime = options?.endTime;
    }
    return this.client.post<QueryResult>(
      this.localPath + '/datasets/_apl',
      {
        body: JSON.stringify(req),
      },
      {
        'streaming-duration': options?.streamingDuration as string,
        nocache: options?.noCache as boolean,
        format: 'legacy',
      },
    );
  };

  aplQuery = (apl: string, options?: QueryOptions): Promise<QueryResult> => this.query(apl, options);
}

export enum ContentType {
  JSON = 'application/json',
  NDJSON = 'application/x-ndjson',
  CSV = 'text/csv',
}

export enum ContentEncoding {
  Identity = '',
  GZIP = 'gzip',
}

export interface IngestOptions {
  timestampField?: string;
  timestampFormat?: string;
  csvDelimiter?: string;
}

export interface IngestStatus {
  ingested: number;
  failed: number;
  failures?: Array<IngestFailure>;
  processedBytes: number;
  blocksCreated: number;
  walLength: number;
}

export interface IngestFailure {
  timestamp: string;
  error: string;
}

export interface QueryOptionsBase {
  streamingDuration?: string;
  noCache?: boolean;
}

export interface QueryOptions extends QueryOptionsBase {
  startTime?: string;
  endTime?: string;
}

export interface QueryLegacy {
  aggregations?: Array<Aggregation>;
  continuationToken?: string;
  cursor?: string;
  endTime: string;
  filter?: Filter;
  groupBy?: Array<string>;
  includeCursor?: boolean;
  limit?: number;
  order?: Array<Order>;
  project?: Array<Projection>;
  resolution: string;
  startTime: string;
  virtualFields?: Array<VirtualColumn>;
}

export interface Aggregation {
  argument?: any;
  field: string;
  op: AggregationOp;
}

export enum AggregationOp {
  Count = 'count',
  Distinct = 'distinct',
  Sum = 'sum',
  Avg = 'avg',
  Min = 'min',
  Max = 'max',
  Topk = 'topk',
  Percentiles = 'percentiles',
  Histogram = 'histogram',
  Variance = 'variance',
  Stdev = 'stdev',
  ArgMin = 'argmin',
  ArgMax = 'argmax',
  MakeSet = 'makeset',
  MakeSetIf = 'makesetif',
  CountIf = 'countif',
  CountDistinctIf = 'distinctif',
}

export interface Filter {
  caseSensitive?: boolean;
  children?: Array<Filter>;
  field: string;
  op: FilterOp;
  value?: any;
}

export enum FilterOp {
  And = 'and',
  Or = 'or',
  Not = 'not',
  Equal = '==',
  NotEqual = '!=',
  Exists = 'exists',
  NotExists = 'not-exists',
  GreaterThan = '>',
  GreaterThanOrEqualTo = '>=',
  LessThan = '<',
  LessThanOrEqualTo = '<=',
  Gt = 'gt',
  Gte = 'gte',
  Lt = 'lt',
  Lte = 'lte',
  StartsWith = 'starts-with',
  NotStartsWith = 'not-starts-with',
  EndsWith = 'ends-with',
  NotEndsWith = 'not-ends-with',
  Contains = 'contains',
  NotContains = 'not-contains',
  Regexp = 'regexp',
  NotRegexp = 'not-regexp',
}

export interface Order {
  desc: boolean;
  field: string;
}

export interface Projection {
  alias?: string;
  field: string;
}

export interface VirtualColumn {
  alias: string;
  expr: string;
}

export interface QueryLegacyResult {
  buckets: Timeseries;
  matches?: Array<Entry>;
  status: Status;
}

export interface QueryResult {
  request: QueryLegacy;

  // Copied from QueryResult
  buckets: Timeseries;
  datasetNames: string[];
  matches?: Array<Entry>;
  status: Status;
}

export interface Timeseries {
  series?: Array<Interval>;
  totals?: Array<EntryGroup>;
}

export interface Interval {
  endTime: string;
  groups?: Array<EntryGroup>;
  startTime: string;
}

export interface EntryGroup {
  aggregations?: Array<EntryGroupAgg>;
  group: { [key: string]: any };
  id: number;
}

export interface EntryGroupAgg {
  op: string;
  value: any;
}

export interface Entry {
  _rowId: string;
  _sysTime: string;
  _time: string;
  data: { [key: string]: any };
}

export interface Status {
  blocksExamined: number;
  continuationToken?: string;
  elapsedTime: number;
  isEstimate?: boolean;
  isPartial: boolean;
  maxBlockTime: string;
  messages?: Array<Message>;
  minBlockTime: string;
  numGroups: number;
  rowsExamined: number;
  rowsMatched: number;
  maxCursor: string;
  minCursor: string;
}

export interface Message {
  code?: string;
  count: number;
  msg: string;
  priority: string;
}

export interface Query {
  apl: string;
  startTime?: string;
  endTime?: string;
}
