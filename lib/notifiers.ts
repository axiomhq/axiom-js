import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export interface Notifier {
    id?: string;
    name: string;
    type?: Type;
    properties?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    disabledUntil?: string;
    metaCreated?: string;
    metaModified?: string;
    metaVersion?: number;
}

export enum Type {
    Pagerduty = 'pagerduty',
    Slack = 'slack',
    Email = 'email',
    Webhook = 'webhook',
}

export default class NotifiersService extends HTTPClient {
    private readonly localPath = '/api/v1/notifiers';

    list = (): Promise<[Notifier]> =>
        this.client.get<[Notifier]>(this.localPath).then((response) => {
            return response.data;
        });

    get = (id: string): Promise<Notifier> =>
        this.client.get<Notifier>(this.localPath + '/' + id).then((response) => {
            return response.data;
        });

    create = (notifier: Notifier): Promise<Notifier> =>
        this.client.post<Notifier>(this.localPath, notifier).then((response) => {
            return response.data;
        });

    update = (id: string, notifier: Notifier): Promise<Notifier> =>
        this.client.put<Notifier>(this.localPath + '/' + id, notifier).then((response) => {
            return response.data;
        });

    delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);
}
