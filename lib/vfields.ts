import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export interface VirtualField {
    id: string;
    name: string;
    description: string;
    alias: string;
    dataset: string;
    expression: string;
}

export default class VirtualFieldsService extends HTTPClient {
    private readonly localPath = '/api/v1/vfields';

    list = (): Promise<[VirtualField]> =>
        this.client.get<[VirtualField]>(this.localPath).then((response) => {
            return response.data;
        });

    get = (id: string): Promise<VirtualField> =>
        this.client.get<VirtualField>(this.localPath + '/' + id).then((response) => {
            return response.data;
        });

    create = (virtualField: VirtualField): Promise<VirtualField> =>
        this.client.post<VirtualField>(this.localPath, virtualField).then((response) => {
            return response.data;
        });

    update = (id: string, virtualField: VirtualField): Promise<VirtualField> =>
        this.client.put<VirtualField>(this.localPath + '/' + id, virtualField).then((response) => {
            return response.data;
        });

    delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);
}
