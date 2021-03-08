import MonitorsService from './monitors';
import NotifiersService from './notifiers';
import StarredQueriesService from './starred';
import TeamsService from './teams';
import { IngestTokensService, PersonalTokensService } from './tokens';
import UsersService from './users';
import VersionService from './version';
import VirtualFieldsService from './vfields';

export const CloudURL = 'https://cloud.axiom.co';

export default class Client {
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

    constructor(basePath: string, accessToken: string) {
        this.monitors = new MonitorsService(basePath, accessToken);
        this.notifiers = new NotifiersService(basePath, accessToken);
        this.starred = new StarredQueriesService(basePath, accessToken);
        this.teams = new TeamsService(basePath, accessToken);
        this.tokens = {
            ingest: new IngestTokensService(basePath, accessToken),
            personal: new PersonalTokensService(basePath, accessToken),
        };
        this.users = new UsersService(basePath, accessToken);
        this.version = new VersionService(basePath, accessToken);
        this.virtualFields = new VirtualFieldsService(basePath, accessToken);
    }
}
