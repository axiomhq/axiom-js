import { LogLevel } from '../logger';
import { Transport } from './transport';
import { SimpleFetchTransport } from './fetch';
interface AxiomFetchConfig {
  dataset: string;
  token: string;
  url?: string;
  autoFlush?: boolean | number;
  logLevel?: LogLevel;
}

const DEFAULT_URL = 'https://api.axiom.co';

export class AxiomFetchTransport extends SimpleFetchTransport implements Transport {
  constructor(config: AxiomFetchConfig) {
    super({
      input: `${config.url ?? DEFAULT_URL}/v1/datasets/${config.dataset}/ingest`,
      init: {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
      },
      autoFlush: config.autoFlush,
      logLevel: config.logLevel,
    });
  }
}
