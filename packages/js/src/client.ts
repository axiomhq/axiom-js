import { datasets } from './datasets.js';
import { users } from './users.js';
import { Batch, createBatchKey } from './batch.js';
import HTTPClient, { ClientOptions } from './httpClient.js';

class BaseClient extends HTTPClient {
  datasets: datasets.Service;
  users: users.Service;
  localPath = '/v1';
  onError = console.error;

  constructor(options: ClientOptions) {
    super(options);
    this.datasets = new datasets.Service(options);
    this.users = new users.Service(options);
    if (options.onError) {
      this.onError = options.onError;
    }
  }

  /**
   * Ingest events into the provided dataset using raw data types, e.g: string, buffer or a stream.
   * 
   * @param dataset - name of the dataset to ingest events into
   * @param data - data to be ingested
   * @param contentType - optional content type, defaults to JSON
   * @param contentEncoding - optional content encoding, defaults to Identity
   * @param options - optional ingest options
   * @returns result a promise of ingest and its status, check: {@link IngestStatus}
   * 
   * @example
   * ```
   * import { AxiomWithoutBatching } from '@axiomhq/js';
   * 
   * const axiom = new AxiomWithoutBatching();
   * ```
   * 
   */
  ingestRaw = async (
    dataset: string,
    data: string | Buffer | ReadableStream,
    contentType: ContentType = ContentType.JSON,
    contentEncoding: ContentEncoding = ContentEncoding.Identity,
    options?: IngestOptions,
  ): Promise<IngestStatus> => {
      try {
      return await this.client.post<IngestStatus>(
        this.localPath + '/datasets/' + dataset + '/ingest',
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
        });
    } catch (err) {
      this.onError(err);
      return await Promise.resolve({
        ingested: 0,
        failed: 0,
        processedBytes: 0,
        blocksCreated: 0,
        walLength: 0,
      });
    }
    }

  queryLegacy = (dataset: string, query: QueryLegacy, options?: QueryOptions): Promise<QueryLegacyResult> =>
    this.client.post(
      this.localPath + '/datasets/' + dataset + '/query',
      {
        body: JSON.stringify(query),
      },
      {
        'streaming-duration': options?.streamingDuration as string,
        nocache: options?.noCache as boolean,
      },
    );

  /**
   * Executes APL query using the provided APL and returns the result
   * 
   * @param apl - the apl query
   * @param options - optional query options
   * @returns result of the query, check: {@link QueryResult}
   * 
   * @example
   * ```
   * await axiom.query("['dataset'] | count");
   * ```
   * 
   */
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

  /**
   * Executes APL query using the provided APL and returns the result.
   * This is just an alias for the `query()` method, please use that instead.
   * 
   * @param apl - the apl query
   * @param options - optional query options
   * @returns Promise<QueryResult>
   * 
   * @example
   * ```
   * await axiom.aplQuery("['dataset'] | count");
   * ```
   */
  aplQuery = (apl: string, options?: QueryOptions): Promise<QueryResult> => this.query(apl, options);
}

/**
 * Axiom's client without batching events in the background.
 * In most cases you'll want to use the {@link Axiom} client instead.
 * 
 * 
 * @param options - The {@link ClientOptions} to configure authentication
 * 
 */
export class AxiomWithoutBatching extends BaseClient {
  /**
   * Ingest event(s) asynchronously
   * 
   * @param dataset - name of the dataset to ingest events into
   * @param events - list of events to be ingested, could be a single object as well
   * @param options - optional ingest options
   * @returns the result of the ingest, check: {@link IngestStatus}
   * 
   * @example
   * ```
   * import { AxiomWithoutBatching } from '@axiomhq/js';
   * 
   * const axiom = new AxiomWithoutBatching();
   * await axiom.ingest('dataset-name', [{ foo: 'bar' }])
   * ```
   * 
   */
  async ingest(dataset: string, events: Array<object> | object, options?: IngestOptions): Promise<IngestStatus> {
    const array = Array.isArray(events) ? events : [events];
    const json = array.map((v) => JSON.stringify(v)).join('\n');

    return this.ingestRaw(dataset, json, ContentType.NDJSON, ContentEncoding.Identity, options);
  }
}

/**
 * Axiom's default client that queues events in the background,
 * sends them asynchronously to the server every 1s or every 1000 events.
 * 
 * @param options - The options passed to the client
 * 
 */
export class Axiom extends BaseClient {
  batch: { [id: string]: Batch } = {};

  /**
   * Ingest events asynchronously
   * 
   * @remarks
   * Events passed to ingest method will be queued in a batch and sent
   * in the background every second or every 1000 events. 
   * 
   * @param dataset - name of the dataset to ingest events into
   * @param events - list of events to be ingested, could be a single object as well
   * @param options - optional ingest options
   * @returns void, as the events are sent in the background
   * 
   */
  ingest = (dataset: string, events: Array<object> | object, options?: IngestOptions) => {
    const key = createBatchKey(dataset, options);
    if (!this.batch[key]) {
      this.batch[key] = new Batch(
        (dataset, events, options) => {
          const array = Array.isArray(events) ? events : [events];
          const json = array.map((v) => JSON.stringify(v)).join('\n');
          return this.ingestRaw(dataset, json, ContentType.NDJSON, ContentEncoding.Identity, options);
        },
        dataset,
        options,
      );
    }
    return this.batch[key].ingest(events);
  };

  /**
   * Flushes all the events that have been queued in the background
   * 
   * @remarks
   * calling `await flush()` will wait for all the events to be sent to the server
   * and is necessary to ensure data delivery.
   */
  flush = async (): Promise<void> => {
    let promises: Array<Promise<IngestStatus | void>> = [];
    for (const key in this.batch) {
      promises.push(this.batch[key].flush().catch(this.onError));
    }
    await Promise.all(promises).catch(this.onError);
  };
}

declare global {
  interface BigInt {
    toJSON: () => string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export enum ContentType {
  JSON = 'application/json',
  NDJSON = 'application/x-ndjson',
  CSV = 'text/csv',
}

export enum ContentEncoding {
  Identity = '',
  GZIP = 'gzip',
}

/**
 * Ingest options
 * 
 */
export interface IngestOptions {
  /**
   * name of the field that contains the timestamp
   */
  timestampField?: string;
  /**
   * format of the timestamp
   */
  timestampFormat?: string;
  /**
   * delimiter used in the csv file
   */
  csvDelimiter?: string;
}

/**
 * Query result
 * 
 */
export interface IngestStatus {
  /**
   * number of ingested events
   */
  ingested: number;
  /**
   * number of failed events
   */
  failed: number;
  /**
   * list of failed events
   */
  failures?: Array<IngestFailure>;
  /**
   * number of processed bytes
   */
  processedBytes: number;
  /**
   * number of blocks created
   */
  blocksCreated: number;
  /**
   * length of the write ahead log
   */
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
