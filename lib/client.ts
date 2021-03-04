import MonitorsService from './monitors';
import NotifiersService from './notifiers';
import UsersService from './users';
import VersionService from './version';
import VirtualFieldsService from './vfields';

export const CloudURL = 'https://cloud.axiom.co';

export default class Client {
    monitors: MonitorsService;
    notifiers: NotifiersService;
    users: UsersService;
    version: VersionService;
    virtualFields: VirtualFieldsService;

    constructor(basePath: string, accessToken: string) {
        this.monitors = new MonitorsService(basePath, accessToken);
        this.notifiers = new NotifiersService(basePath, accessToken);
        this.users = new UsersService(basePath, accessToken);
        this.version = new VersionService(basePath, accessToken);
        this.virtualFields = new VirtualFieldsService(basePath, accessToken);
    }
}
