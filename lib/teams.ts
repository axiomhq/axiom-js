import { AxiosResponse } from 'axios';

import HTTPClient from './httpClient';

export namespace teams {
    export interface Team {
        id?: string;
        name: string;
        members: Array<string>;
        datasets: Array<string>;
    }

    export interface CreateRequest {
        name: string;
        datasets: Array<string>;
    }

    export class Service extends HTTPClient {
        private readonly localPath = '/api/v1/teams';

        list = (): Promise<[Team]> =>
            this.client.get<[Team]>(this.localPath).then((response) => {
                return response.data;
            });

        get = (id: string): Promise<Team> =>
            this.client.get<Team>(this.localPath + '/' + id).then((response) => {
                return response.data;
            });

        create = (team: CreateRequest): Promise<Team> =>
            this.client.post<Team>(this.localPath, team).then((response) => {
                return response.data;
            });

        update = (id: string, team: Team): Promise<Team> =>
            this.client.put<Team>(this.localPath + '/' + id, team).then((response) => {
                return response.data;
            });

        delete = (id: string): Promise<AxiosResponse> => this.client.delete<AxiosResponse>(this.localPath + '/' + id);
    }
}
