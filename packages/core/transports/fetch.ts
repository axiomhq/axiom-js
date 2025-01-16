import { Transport } from '.';
import { LogEvent } from '..';

interface FetchConfig {
  input: Parameters<typeof fetch>[0];
  init?: Omit<Parameters<typeof fetch>[1], 'body'>;
}

export class SimpleFetchTransport implements Transport {
  private fetchConfig: FetchConfig;
  private events: LogEvent[] = [];

  constructor(config: FetchConfig) {
    this.fetchConfig = config;
  }

  log: Transport['log'] = (logs) => {
    this.events.push(...logs);
  };

  async flush() {
    await fetch(this.fetchConfig.input, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...this.fetchConfig.init,
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
