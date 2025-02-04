import { LogLevel } from '../logger';
import { Transport } from './transport';
import { SimpleFetchTransport } from './fetch';

interface AxiomProxyConfig {
  url: string;
  autoFlush?: boolean | number;
  logLevel?: LogLevel;
}
export class AxiomProxyTransport extends SimpleFetchTransport implements Transport {
  constructor(config: AxiomProxyConfig) {
    super({
      input: config.url,
      autoFlush: config.autoFlush,
      logLevel: config.logLevel,
    });
  }
}
