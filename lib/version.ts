import HTTPClient from './httpClient';

export interface Version {
    currentVersion?: string;
}

export default class VersionService extends HTTPClient {
    private readonly localPath = '/api/v1/version';

    get = (): Promise<Version> =>
        this.client.get<Version>(this.localPath).then((response) => {
            return response.data;
        });
}
