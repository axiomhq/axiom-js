import { Transport } from '.';
import { LogEvent } from '..';

interface AxiomProxyConfig {
  url: string;
}

export class AxiomProxyTransport implements Transport {
  private config: AxiomProxyConfig;
  private events: LogEvent[] = [];

  constructor(config: AxiomProxyConfig) {
    this.config = config;
  }

  log: Transport['log'] = (logs) => {
    this.events.push(...logs);
  };

  async flush() {
    await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.events),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error(await res.text());
          throw new Error('Failed to flush logs');
        }
        this.events = [];
      })
      .catch(console.error);
  }
}
