import Transport, { TransportStreamOptions } from 'winston-transport';

import { AxiomWithoutBatching } from '@axiomhq/js';

export interface WinstonOptions extends TransportStreamOptions {
  dataset?: string;
  token: string;
  orgId?: string;
  url?: string;
  /**
   * The Axiom regional edge domain to use for ingestion.
   * Specify the domain name only (no scheme, no path).
   * When set, data is sent to `https://{region}/v1/ingest/{dataset}`.
   * Cannot be used together with `url` or `edgeUrl`.
   *
   * @example "mumbai.axiom.co"
   * @example "eu-central-1.aws.edge.axiom.co"
   */
  region?: string;
  /**
   * The base URL of the Axiom edge endpoint for ingest and query operations.
   * Cannot be used together with `url` or `region`.
   *
   * @example "https://eu-central-1.aws.edge.axiom.co/v1"
   */
  edgeUrl?: string;
  onError?: (err: Error) => void;
}

export class WinstonTransport extends Transport {
  client: AxiomWithoutBatching;
  dataset: string;
  batch: object[] = [];
  batchCallback: (err: Error | null) => void = () => {};
  batchTimeoutId?: NodeJS.Timeout;

  constructor(opts: WinstonOptions) {
    super(opts);
    this.client = new AxiomWithoutBatching({
      token: opts.token,
      orgId: opts.orgId,
      url: opts.url,
      region: opts.region,
      edgeUrl: opts.edgeUrl,
      onError: opts.onError,
    });
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

  flush(callback: (err: Error | null) => void = () => {}) {
    const batchCopy = this.batch.slice();

    clearTimeout(this.batchTimeoutId);
    this.batchTimeoutId = undefined;
    this.batchCallback = () => {};
    this.batch = [];

    this.client
      .ingest(this.dataset, batchCopy)
      .then((_res: any) => callback(null))
      .catch(callback);
  }
}
