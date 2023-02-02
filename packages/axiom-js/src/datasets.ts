
import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export namespace datasets {
    export const TimestampField = '_time';

    export interface Dataset {
        id: number;
        name: string;
        description?: string;
        who?: string;
        created: string;
    }

    export interface Field {
        name: string;
        description: string;
        type: string;
        unit: string;
        hidden: boolean;
    }

    export interface TrimResult {}

    export interface CreateRequest {
        name: string;
        description?: string;
    }

    export interface UpdateRequest {
        description: string;
    }



    interface TrimRequest {
        maxDuration: string;
    }

    export class Service extends HTTPClient {
        private readonly localPath = '/v1/datasets';

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

        trim = (id: string, maxDurationStr: string): Promise<TrimResult> => {
            // Go's 'time.Duration' uses nanoseconds as its base unit. So parse the
            // duration string and convert to nanoseconds. 1ms = 1000000ns.
            const req: TrimRequest = { maxDuration: maxDurationStr };
            return this.client.post<TrimResult>(this.localPath + '/' + id + '/trim', req).then((response) => {
                return response.data;
            });
        };
    }
}
