import { AxiosResponse } from 'axios';
import { Readable, Stream } from 'stream';

import HTTPClient from './httpClient';
import { QueryKind } from './starred';

const toTime = require('to-time'); // eslint-disable-line @typescript-eslint/no-var-requires

export const TimestampField = '_time';

export enum ContentType {
    JSON = 'application/json',
    NDJSON = 'application/x-ndjson',
    CSV = 'text/csv',
}

export enum ContentEncoding {
    Identity = '',
    GZIP = 'gzip',
}

export interface Dataset {
    id: number;
    name: string;
    description?: string;
    created: string;
}

export interface Field {
    name: string;
    type: string;
    typeHint: string;
}

export interface Info {
    name: string;
    fields?: Array<Field>;
    compressedBytes: number;
    compressedBytesHuman: string;
    inputBytes: number;
    inputBytesHuman: string;
    numBlocks: number;
    numEvents: number;
    numFields: number;
    maxTime?: string;
    minTime?: string;
    created: string;
}

export interface Stats {
    datasets?: Array<Info>;
    numBlocks: number;
    numEvents: number;
    inputBytes: number;
    inputBytesHuman: string;
    compressedBytes: number;
    compressedBytesHuman: string;
}

export interface TrimResult {
    numDeleted: number;
}

export interface HistoryQuery {
    id: string;
    dataset: string;
    kind: QueryKind;
    // query: QueryRequest; //FIXME(lukasmalkmus): Add QueryRequest type
    who: string;
    created: string;
}

export interface CreateRequest {
    name: string;
    description?: string;
}

export interface UpdateRequest {
    description: string;
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

interface TrimRequest {
    maxDuration: number;
}

export default class StarredQueriesService extends HTTPClient {
    private readonly localPath = '/api/v1/datasets';

    stats = (): Promise<Stats> =>
        this.client.get<Stats>(this.localPath + '/_stats').then((response) => {
            return response.data;
        });

    list = (): Promise<[Dataset]> =>
        this.client.get<[Dataset]>(this.localPath).then((response) => {
            return response.data;
        });

    get = (id: string): Promise<Dataset> =>
        this.client.get<Dataset>(this.localPath + '/' + id).then((response) => {
            return response.data;
        });

    create = (req: CreateRequest): Promise<Dataset> =>
        this.client.post<Dataset>(this.localPath, req).then((response) => {
            return response.data;
        });

    update = (id: string, req: UpdateRequest): Promise<Dataset> =>
        this.client.put<Dataset>(this.localPath + '/' + id, req).then((response) => {
            return response.data;
        });

    delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);

    info = (id: string): Promise<Info> =>
        this.client.get<Info>(this.localPath + '/' + id + '/info').then((response) => {
            return response.data;
        });

    trim = (id: string, maxDurationStr: string): Promise<TrimResult> => {
        // Go's 'time.Duration' uses nanoseconds as its base unit. So parse the
        // duration string and convert to nanoseconds. 1ms = 1000000ns.
        const req: TrimRequest = { maxDuration: toTime(maxDurationStr).ms() * 1000000 };
        return this.client.post<TrimResult>(this.localPath + '/' + id + '/trim', req).then((response) => {
            return response.data;
        });
    };

    history = (id: string): Promise<HistoryQuery> =>
        this.client.get<HistoryQuery>(this.localPath + '/_history/' + id).then((response) => {
            return response.data;
        });

    ingest = (
        id: string,
        stream: Stream,
        contentType: ContentType,
        contentEncoding: ContentEncoding,
        options?: IngestOptions,
    ): Promise<IngestStatus> =>
        this.client
            .post<IngestStatus>(this.localPath + '/' + id + '/ingest', stream, {
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

    ingestString = (
        id: string,
        data: string,
        contentType: ContentType,
        contentEncoding: ContentEncoding,
        options?: IngestOptions,
    ): Promise<IngestStatus> => this.ingest(id, Readable.from(data), contentType, contentEncoding, options);
}
