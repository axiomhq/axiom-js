import { FetchClient } from './fetchClient';
import { Limit, LimitType } from './limit';

declare global {
    var EdgeRuntime: string;
}

const Version = require('../package.json').version;
const AxiomURL = 'https://api.axiom.co';

export interface ClientOptions {
    token?: string;
    url?: string;
    orgId?: string;
}

export default abstract class HTTPClient {
    protected readonly client: FetchClient;

    constructor(options: ClientOptions = {}) {
        const token = options.token || process.env.AXIOM_TOKEN || '';
        const url = options.url || process.env.AXIOM_URL || AxiomURL;
        const orgId = options.orgId || process.env.AXIOM_ORG_ID || '';

        const headers: HeadersInit = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
        };
        if (typeof window === 'undefined') {
            headers['User-Agent'] = 'axiom-js/' + Version;
        }
        if (orgId) {
            headers['X-Axiom-Org-Id'] = orgId;
        }

        this.client = new FetchClient({
            headers,
            baseUrl: url,
            timeout: 3000,
        });
    }
}
