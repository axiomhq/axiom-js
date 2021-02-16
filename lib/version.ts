import { Client } from './client';

export interface Version {
    currentVersion?: string;
}

export class VersionService extends Client {
    localPath = '/api/v1/version';

    get = (): Promise<Version> =>
        this.client.get<Version>(this.localPath).then((response) => {
            return response.data;
        });
}
