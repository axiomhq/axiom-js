import HTTPClient from './httpClient';

export namespace version {
    export interface Version {
        currentVersion?: string;
    }

    export class Service extends HTTPClient {
        private readonly localPath = '/api/v1/version';

        get = (): Promise<Version> =>
            this.client.get<Version>(this.localPath).then((response) => {
                return response.data;
            });
    }
}
