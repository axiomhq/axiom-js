import { datasets } from './datasets';
import { users } from './users';
import HTTPClient, { ClientOptions } from './httpClient';
import { gzip } from 'zlib';
import { promisify } from 'util';
import { Readable, Stream } from 'stream';

export default class Client extends HTTPClient {
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
        data: string,
        contentType: ContentType,
        contentEncoding: ContentEncoding,
        options?: IngestOptions,
    ): Promise<IngestStatus> =>
        this.client
        .post<IngestStatus>(this.localPath + '/datasets/' + id + '/ingest', data, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': contentEncoding,
                },
                params: {
                    'timestamp-field': options?.timestampField,
                    'timestamp-format': options?.timestampFormat,
                    'csv-delimiter': options?.csvDelimiter,
                },
            })
            .then((response) => {
                return response.data;
            });

    ingestStream = (
        id: string,
        stream: Stream,
        contentType: ContentType,
        contentEncoding: ContentEncoding,
        options?: IngestOptions,
    ): Promise<IngestStatus> =>
        this.client
        .post<IngestStatus>(this.localPath + '/datasets/' + id + '/ingest', stream, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': contentEncoding,
                },
                params: {
                    'timestamp-field': options?.timestampField,
                    'timestamp-format': options?.timestampFormat,
                    'csv-delimiter': options?.csvDelimiter,
                },
            })
            .then((response) => {
                return response.data;
            });

    ingestBuffer = (
        id: string,
        buffer: Buffer,
        contentType: ContentType,
        contentEncoding: ContentEncoding,
        options?: IngestOptions,
    ): Promise<IngestStatus> => this.ingestStream(id, Readable.from(buffer), contentType, contentEncoding, options);

    ingestString = (
        id: string,
        data: string,
        contentType: ContentType,
        contentEncoding: ContentEncoding,
        options?: IngestOptions,
    ): Promise<IngestStatus> => this.ingest(id, data, contentType, contentEncoding, options);

    ingestEvents = async (
        id: string,
        events: Array<object> | object,
        options?: IngestOptions,
    ): Promise<IngestStatus> => {
        const array = Array.isArray(events) ? events : [events];
        const json = array.map((v) => JSON.stringify(v)).join('\n');
        const encoded = await promisify(gzip)(json);
        return this.ingestBuffer(id, encoded, ContentType.NDJSON, ContentEncoding.GZIP, options);
    };

    queryLegacy = (id: string, query: QueryLegacy, options?: QueryOptions): Promise<QueryLegacyResult> =>
        this.client
        .post<QueryLegacyResult>(this.localPath + '/datasets/' + id + '/query', query, {
                params: {
                    'streaming-duration': options?.streamingDuration,
                    nocache: options?.noCache,
                },
            })
            .then((response) => {
                return response.data;
            });

    query = (apl: string, options?: QueryOptions): Promise<QueryResult> => {
        const req: Query = { apl: apl, startTime: options?.startTime, endTime: options?.endTime };
        return this.client
        .post<QueryResult>(this.localPath + '/datasets/_apl', req, {
                params: {
                    'streaming-duration': options?.streamingDuration,
                    nocache: options?.noCache,
                    format: 'legacy',
                },
            })
            .then((response) => {
                return response.data;
            });
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
