import { datasets } from './datasets';
import { users } from './users';
import { version } from './version';
import { vfields } from './vfields';

export default class Client {
    datasets: datasets.Service;
    users: users.Service;
    version: version.Service;
    virtualFields: vfields.Service;

    constructor(basePath?: string, accessToken?: string, orgID?: string) {
        this.datasets = new datasets.Service(basePath, accessToken, orgID);
        this.users = new users.Service(basePath, accessToken, orgID);
        this.version = new version.Service(basePath, accessToken, orgID);
        this.virtualFields = new vfields.Service(basePath, accessToken, orgID);
    }
}
