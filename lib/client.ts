import VersionService from './version';

export const CloudURL = 'https://cloud.axiom.co';

export default class AxiomClient {
    version: VersionService;

    constructor(basePath: string, accessToken: string) {
        this.version = new VersionService(basePath, accessToken);
    }
}
