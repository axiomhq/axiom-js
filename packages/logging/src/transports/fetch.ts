import { Transport } from './transport';
import { LogEvent, LogLevelValue, LogLevel } from '../logger';

interface FetchConfig {
  input: Parameters<typeof fetch>[0];
  init?: Omit<Parameters<typeof fetch>[1], 'body'>;
  autoFlush?: number | boolean;
  logLevel?: LogLevel;
}

export class SimpleFetchTransport implements Transport {
  private fetchConfig: FetchConfig;
  private events: LogEvent[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(config: FetchConfig) {
    this.fetchConfig = config;
  }

  log: Transport['log'] = (logs) => {
    const filteredLogs = logs.filter(
      (log) =>
        LogLevelValue[(log.level as LogLevel) ?? LogLevel.info] >=
        LogLevelValue[this.fetchConfig.logLevel ?? LogLevel.info],
    );

    this.events.push(...filteredLogs);

    if (typeof this.fetchConfig.autoFlush === 'undefined' || this.fetchConfig.autoFlush === false) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(
      () => {
        this.flush();
      },
      typeof this.fetchConfig.autoFlush === 'number' ? this.fetchConfig.autoFlush : 2000,
    );
  };

  async flush() {
    if (this.events.length <= 0) {
      return;
    }

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
