import { datasets } from './datasets.js';
import { users } from './users.js';
import { Batch, createBatchKey } from './batch.js';
import HTTPClient, { ClientOptions, InferOutput } from './httpClient.js';
import { isAxiomPersonalToken } from './token.js';
import type { StandardSchemaV1 } from '@standard-schema/spec';

class BaseClient<TSchema extends StandardSchemaV1 = never> extends HTTPClient {
  datasets: datasets.Service;
  users: users.Service;
  localPath = '/v1';
  onError = console.error;
  protected schema?: TSchema;

  constructor(options: ClientOptions<TSchema>) {
    if (options.token && isAxiomPersonalToken(options.token)) {
      console.warn(
        'Using a personal token (`xapt-...`) is deprecated for security reasons. Please use an API token (`xaat-...`) instead. Support for personal tokens will be removed in a future release.',
      );
    }

    const { schema, ...baseOptions } = options;
    super(baseOptions);
    this.datasets = new datasets.Service(baseOptions);
    this.users = new users.Service(baseOptions);
    if (options.onError) {
      this.onError = options.onError;
    }
    if (schema) {
      this.schema = schema;
    }
  }

  /**
   * Validates an event against the schema if one is provided.
   * @param event - event to validate
   * @returns validated event
   * @throws error if validation fails
   */
  protected async validateEvent(event: unknown): Promise<InferOutput<TSchema>> {
    if (!this.schema) {
      return event as InferOutput<TSchema>;
    }

    const result = await this.schema['~standard'].validate(event);

    if (result.issues) {
      const errorMessages = result.issues
        .map((issue) => {
          const path =
            issue.path?.map((p) => (typeof p === 'object' && 'key' in p ? p.key : String(p))).join('.') || 'root';
          return `${path}: ${issue.message}`;
        })
        .join(', ');
      throw new Error(`Schema validation failed: ${errorMessages}`);
    }

    return ('value' in result ? result.value : event) as InferOutput<TSchema>;
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
          body: data as BodyInit,
        },
        {
          'timestamp-field': options?.timestampField as string,
          'timestamp-format': options?.timestampFormat as string,
          'csv-delimiter': options?.csvDelimiter as string,
        },
      );
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
  };

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
      120_000,
    );

  /**
   * Executes APL query using the provided APL and returns the result
   *
   * @param apl - the apl query
   * @param options - optional query options
   * @returns result of the query depending on the format in options, check: {@link QueryResult} and {@link TabularQueryResult}
   *
   * @example
   * ```
   * await axiom.query("['dataset'] | count");
   * ```
   *
   */
  query = <
    TOptions extends QueryOptions,
    TResult = TOptions['format'] extends 'tabular' ? Promise<TabularQueryResult> : Promise<QueryResult>,
  >(
    apl: string,
    options?: TOptions,
  ): Promise<TResult> => {
    const req: Query = { apl: apl };
    if (options?.startTime) {
      req.startTime = options?.startTime;
    }
    if (options?.endTime) {
      req.endTime = options?.endTime;
    }

    return this.client
      .post<TOptions['format'] extends 'tabular' ? RawTabularQueryResult : QueryResult>(
        this.localPath + '/datasets/_apl',
        {
          body: JSON.stringify(req),
        },
        {
          'streaming-duration': options?.streamingDuration as string,
          nocache: options?.noCache as boolean,
          format: options?.format ?? 'legacy',
          cursor: options?.cursor as string,
        },
        120_000,
      )
      .then((res) => {
        if (options?.format !== 'tabular') {
          return res;
        }

        const result = res as RawTabularQueryResult;
        return {
          ...res,
          tables: result.tables.map((t) => {
            return {
              ...t,
              events: function* () {
                let iteration = 0;
                if (!this.columns) {
                  return;
                }

                while (iteration <= this.columns[0].length) {
                  const value = Object.fromEntries(
                    this.fields.map((field, fieldIdx) => [field.name, this.columns![fieldIdx][iteration]]),
                  );

                  if (iteration >= this.columns[0].length) {
                    return value;
                  }

                  yield value;
                  iteration++;
                }
              },
            };
          }),
        };
      }) as Promise<TResult>;
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
  aplQuery = <
    TOptions extends QueryOptions,
    TResult = TOptions['format'] extends 'tabular' ? Promise<TabularQueryResult> : Promise<QueryResult>,
  >(
    apl: string,
    options?: TOptions,
  ): Promise<TResult> => this.query(apl, options);
}

/**
 * Axiom's client without batching events in the background.
 * In most cases you'll want to use the {@link Axiom} client instead.
 *
 *
 * @param options - The {@link ClientOptions} to configure authentication
 *
 */
export class AxiomWithoutBatching<TSchema extends StandardSchemaV1 = never> extends BaseClient<TSchema> {
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
  async ingest(
    dataset: string,
    events: [TSchema] extends [never] ? object | object[] : InferOutput<TSchema> | InferOutput<TSchema>[],
    options?: IngestOptions,
  ): Promise<IngestStatus> {
    const array = Array.isArray(events) ? events : [events];

    // Validate events if schema is provided
    if (this.schema) {
      try {
        const validatedEvents = await Promise.all(array.map((event) => this.validateEvent(event)));
        const json = validatedEvents.map((v) => JSON.stringify(v)).join('\n');
        return this.ingestRaw(dataset, json, ContentType.NDJSON, ContentEncoding.Identity, options);
      } catch (err) {
        this.onError(err as Error);
        return await Promise.resolve({
          ingested: 0,
          failed: array.length,
          processedBytes: 0,
          blocksCreated: 0,
          walLength: 0,
        });
      }
    }

    // No schema validation - use as is
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
export class Axiom<TSchema extends StandardSchemaV1 = never> extends BaseClient<TSchema> {
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
  ingest = async (
    dataset: string,
    events: [TSchema] extends [never] ? object | object[] : InferOutput<TSchema> | InferOutput<TSchema>[],
    options?: IngestOptions,
  ) => {
    // Validate events if schema is provided
    if (this.schema) {
      const array = Array.isArray(events) ? events : [events];
      try {
        const validatedEvents = await Promise.all(array.map((event) => this.validateEvent(event)));
        // Continue with validated events
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
        // Cast to object array since we know validated events are objects
        return this.batch[key].ingest(validatedEvents as object[]);
      } catch (err) {
        this.onError(err as Error);
        return;
      }
    }

    // No schema validation - use as is
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
    return this.batch[key].ingest(events as object | object[]);
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
  format?: 'legacy' | 'tabular';
  cursor?: string;
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

export interface TabularAggregation {
  name: AggregationOp;
  args: any[];
  fields: string[];
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

export interface RawTabularQueryResult {
  datasetNames: string[];
  fieldsMetaMap: Record<
    string,
    Array<{ description: string; hidden: boolean; name: string; type: string; unit: string }>
  >;
  format: string;
  status: Status;
  tables: Array<RawAPLResultTable>;
}

export interface TabularQueryResult extends RawTabularQueryResult {
  tables: Array<APLResultTable>;
}

export interface RawAPLResultTable {
  name: string;
  sources: Array<{ name: string }>;
  fields: Array<{ name: string; type: string; agg?: TabularAggregation }>;
  order: Array<{
    name: string;
    desc: boolean;
  }>;
  groups: Array<{ name: string }>;
  range?: {
    field: string;
    start: string;
    end: string;
  };
  buckets?: { field: string; size: any };
  columns?: Array<Array<any>>;
}

export interface APLResultTable extends RawAPLResultTable {
  /**
   * Returns an iterable that yields each row of the table as a record,
   * where the keys are the field names and the values are the values in the columns.
   *
   * @returns {Generator<Record<string, any>, undefined, unknown>}
   */
  events: () => Generator<Record<string, any>, undefined, unknown>;
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
