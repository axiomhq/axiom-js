import Transport, { TransportStreamOptions } from 'winston-transport';

import { AxiomWithoutBatching } from '@axiomhq/js';
import type { ClientOptions } from '@axiomhq/js';

const Version = 'AXIOM_VERSION';
const AxiomClient = `axiom-winston/${Version}`;

export interface WinstonOptions extends TransportStreamOptions {
  dataset?: string;
  token: string;
  orgId?: string;
  url?: string;
  /**
   * The Axiom edge domain for ingestion.
   * Specify just the domain without scheme (https:// is added automatically).
   *
   * @example "eu-central-1.aws.edge.axiom.co"
   */
  edge?: string;
  /**
   * The Axiom edge URL for ingestion.
   * Specify the full URL with scheme.
   * Takes precedence over `edge` if both are set.
   *
   * @example "https://eu-central-1.aws.edge.axiom.co"
   */
  edgeUrl?: string;
  /**
   * Additional product tokens to append to the Axiom-Client header.
   * Use product/version tokens separated by spaces.
   *
   * @example "axiom-react/1.2.3 my-app/4.5.6"
   */
  axiomClient?: string;
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
    const clientOptions: ClientOptions = {
      token: opts.token,
      orgId: opts.orgId,
      url: opts.url,
      edge: opts.edge,
      edgeUrl: opts.edgeUrl,
      axiomClient: appendAxiomClient(AxiomClient, opts.axiomClient),
      onError: opts.onError,
    };
    this.client = new AxiomWithoutBatching(clientOptions);
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

function appendAxiomClient(baseAxiomClient: string, axiomClient?: string): string {
  const trimmedAxiomClient = axiomClient?.trim();
  if (!trimmedAxiomClient) {
    return baseAxiomClient;
  }

  return `${baseAxiomClient} ${trimmedAxiomClient}`;
}
