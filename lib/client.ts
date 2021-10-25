import DatasetsService from './datasets';
import MonitorsService from './monitors';
import NotifiersService from './notifiers';
import StarredQueriesService from './starred';
import TeamsService from './teams';
import { IngestTokensService, PersonalTokensService } from './tokens';
import UsersService from './users';
import VersionService from './version';
import VirtualFieldsService from './vfields';

export default class Client {
    datasets: DatasetsService;
    monitors: MonitorsService;
    notifiers: NotifiersService;
    starred: StarredQueriesService;
    teams: TeamsService;
    tokens: {
        ingest: IngestTokensService;
        personal: PersonalTokensService;
    };
    users: UsersService;
    version: VersionService;
    virtualFields: VirtualFieldsService;

    constructor(basePath?: string, accessToken?: string, orgID?: string) {
        this.datasets = new DatasetsService(basePath, accessToken, orgID);
        this.monitors = new MonitorsService(basePath, accessToken, orgID);
        this.notifiers = new NotifiersService(basePath, accessToken, orgID);
        this.starred = new StarredQueriesService(basePath, accessToken, orgID);
        this.teams = new TeamsService(basePath, accessToken, orgID);
        this.tokens = {
            ingest: new IngestTokensService(basePath, accessToken, orgID),
            personal: new PersonalTokensService(basePath, accessToken, orgID),
        };
        this.users = new UsersService(basePath, accessToken, orgID);
        this.version = new VersionService(basePath, accessToken, orgID);
        this.virtualFields = new VirtualFieldsService(basePath, accessToken, orgID);
    }
}
