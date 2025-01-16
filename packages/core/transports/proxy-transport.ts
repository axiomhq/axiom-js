import { Transport } from '.';
import { SimpleFetchTransport } from './fetch';
interface AxiomProxyConfig {
  url: string;
  autoFlush?: boolean | number;
}
export class AxiomProxyTransport extends SimpleFetchTransport implements Transport {
  constructor(config: AxiomProxyConfig) {
    super({
      input: config.url,
      autoFlush: config.autoFlush,
    });
  }
}
