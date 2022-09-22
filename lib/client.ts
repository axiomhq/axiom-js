import { datasets } from './datasets';
import { users } from './users';
import { version } from './version';
import { ClientOptions } from './httpClient';

export default class Client {
    datasets: datasets.Service;
    users: users.Service;
    version: version.Service;

    constructor(options?: ClientOptions) {
        this.datasets = new datasets.Service(options);
        this.users = new users.Service(options);
        this.version = new version.Service(options);
    }
}
