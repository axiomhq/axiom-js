import Transport, { TransportStreamOptions } from 'winston-transport';

import Client from './client';

export interface Options extends TransportStreamOptions {
    dataset?: string;
    token?: string;
    orgId?: string;
    url?: string;
}

export default class AxiomTransport extends Transport {
    client: Client;
    dataset: string;
    batch: object[] = [];
    batchCallback: (err: Error | null) => void = () => {};
    batchTimeoutId?: NodeJS.Timeout;

    constructor(opts?: Options) {
        super(opts);
        this.client = new Client(opts);
        this.dataset = opts?.dataset || process.env.AXIOM_DATASET || '';
    }

    log(info: any, callback: () => void) {
        this.request(info, (err) => {
            if (err) {
                this.emit('error', err);
            } else {
                this.emit('logged', info);
            }
        });

        if (callback) {
            setImmediate(callback);
        }
    }

    private request(info: any, callback: (err: Error | null) => void) {
        if (!info._time) {
            info._time = new Date().toISOString();
        }
        this.batch.push(info);

        if (this.batch.length == 1) {
            this.batchCallback = callback;
            this.batchTimeoutId = setTimeout(() => {
                this.flush();
            }, 1000);
            callback(null);
        } else if (this.batch.length >= 1000) {
            this.flush(callback);
        }
    }

    private flush(callback: (err: Error | null) => void = () => {}) {
        const batchCopy = this.batch.slice();

        clearTimeout(this.batchTimeoutId);
        this.batchTimeoutId = undefined;
        this.batchCallback = () => {};
        this.batch = [];

        this.client.datasets
            .ingestEvents(this.dataset, batchCopy)
            .then((_res) => callback(null))
            .catch(callback);
    }
}
