import { Transport } from '.';
import { LogEvent } from '..';

interface AxiomFetchConfig {
  dataset: string;
  token: string;
  url?: string;
}

const DEFAULT_URL = 'https://api.axiom.co';

export class AxiomFetchTransport implements Transport {
  private config: AxiomFetchConfig;
  private events: LogEvent[] = [];

  constructor(config: AxiomFetchConfig) {
    this.config = { url: DEFAULT_URL, ...config };
  }

  log: Transport['log'] = (logs) => {
    this.events.push(...logs);
  };

  async flush() {
    await fetch(`${this.config.url}/v1/datasets/${this.config.dataset}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
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
