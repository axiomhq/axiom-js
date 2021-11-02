import { datasets } from './datasets';
import { monitors } from './monitors';
import { notifiers } from './notifiers';
import { starred } from './starred';
import { teams } from './teams';
import { tokens } from './tokens';
import { users } from './users';
import { version } from './version';
import { vfields } from './vfields';

export default class Client {
    datasets: datasets.Service;
    monitors: monitors.Service;
    notifiers: notifiers.Service;
    starred: starred.Service;
    teams: teams.Service;
    tokens: {
        ingest: tokens.IngestService;
        personal: tokens.PersonalService;
    };
    users: users.Service;
    version: version.Service;
    virtualFields: vfields.Service;

    constructor(basePath?: string, accessToken?: string, orgID?: string) {
        this.datasets = new datasets.Service(basePath, accessToken, orgID);
        this.monitors = new monitors.Service(basePath, accessToken, orgID);
        this.notifiers = new notifiers.Service(basePath, accessToken, orgID);
        this.starred = new starred.Service(basePath, accessToken, orgID);
        this.teams = new teams.Service(basePath, accessToken, orgID);
        this.tokens = {
            ingest: new tokens.IngestService(basePath, accessToken, orgID),
            personal: new tokens.PersonalService(basePath, accessToken, orgID),
        };
        this.users = new users.Service(basePath, accessToken, orgID);
        this.version = new version.Service(basePath, accessToken, orgID);
        this.virtualFields = new vfields.Service(basePath, accessToken, orgID);
    }
}
