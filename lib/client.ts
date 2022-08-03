import { datasets } from './datasets';
import { tokens } from './tokens';
import { users } from './users';
import { version } from './version';
import { vfields } from './vfields';

export default class Client {
    datasets: datasets.Service;
    tokens: {
        api: tokens.APIService;
        personal: tokens.PersonalService;
    };
    users: users.Service;
    version: version.Service;
    virtualFields: vfields.Service;

    constructor(basePath?: string, accessToken?: string, orgID?: string) {
        this.datasets = new datasets.Service(basePath, accessToken, orgID);
        this.tokens = {
            api: new tokens.APIService(basePath, accessToken, orgID),
            personal: new tokens.PersonalService(basePath, accessToken, orgID),
        };
        this.users = new users.Service(basePath, accessToken, orgID);
        this.version = new version.Service(basePath, accessToken, orgID);
        this.virtualFields = new vfields.Service(basePath, accessToken, orgID);
    }
}
