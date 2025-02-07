import { LogLevel } from '../logger';
import { Transport } from './transport';
import { SimpleFetchTransport } from './fetch';

interface ProxyTransportConfig {
  url: string;
  autoFlush?: boolean | number;
  logLevel?: LogLevel;
}
export class ProxyTransport extends SimpleFetchTransport implements Transport {
  constructor(config: ProxyTransportConfig) {
    super({
      input: config.url,
      autoFlush: config.autoFlush,
      logLevel: config.logLevel,
    });
  }
}
