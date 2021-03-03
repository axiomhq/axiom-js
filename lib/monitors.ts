import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export interface Monitor {
    id: string;
    name: string;
    description?: string;
    dataset: string;
    disabledUntil?: string;
    // query: QueryRequest; //FIXME(lukasmalkmus): Add QueryRequest type
    threshold: number;
    comparison: Comparison;
    noDataCloseWaitMinutes?: number;
    frequencyMinutes: number;
    durationMinutes: number;
    notifiers?: Array<string>;
    lastCheckState?: { [key: string]: string };
    lastCheckTime?: string;
}

export enum Comparison {
    Below = 'Below',
    BelowOrEqual = 'BelowOrEqual',
    Above = 'Above',
    AboveOrEqual = 'AboveOrEqual',
}

export default class MonitorsService extends HTTPClient {
    private readonly localPath = '/api/v1/monitors';

    list = (): Promise<[Monitor]> =>
        this.client.get<[Monitor]>(this.localPath).then((response) => {
            return response.data;
        });

    get = (id: string): Promise<Monitor> =>
        this.client.get<Monitor>(this.localPath + '/' + id).then((response) => {
            return response.data;
        });

    create = (monitor: Monitor): Promise<Monitor> =>
        this.client.post<Monitor>(this.localPath, monitor).then((response) => {
            return response.data;
        });

    update = (id: string, monitor: Monitor): Promise<Monitor> =>
        this.client.put<Monitor>(this.localPath + '/' + id, monitor).then((response) => {
            return response.data;
        });

    delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);
}
