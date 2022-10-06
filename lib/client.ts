import { datasets } from './datasets';
import { users } from './users';
import { ClientOptions } from './httpClient';

export default class Client {
    datasets: datasets.Service;
    users: users.Service;

    constructor(options?: ClientOptions) {
        this.datasets = new datasets.Service(options);
        this.users = new users.Service(options);
    }
}
