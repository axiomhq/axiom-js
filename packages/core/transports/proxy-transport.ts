import { SimpleFetchTransport, Transport } from '.';
interface AxiomProxyConfig {
  url: string;
}

export class AxiomProxyTransport extends SimpleFetchTransport implements Transport {
  constructor(config: AxiomProxyConfig) {
    super({
      input: config.url,
    });
  }
}
