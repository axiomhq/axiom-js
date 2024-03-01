import { Axiom } from '@axiomhq/js';
import { Transport } from '../transport';

export class AxiomTransport implements Transport {
    private client: Axiom;

    constructor(public credentials: AxiomCredentials) {
        this.client = new Axiom({ token: credentials.token, url: credentials.axiomUrl });
    }

    log(event: any) {
        this.client.ingest(this.credentials.dataset, event)
    }

    async flush() {
        return this.client.flush();
    }
}

export interface AxiomCredentials {
    token: string;
    axiomUrl: string;
    dataset: string;
}
