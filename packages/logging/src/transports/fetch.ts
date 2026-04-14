import { Transport } from './transport';
import { LogEvent, LogLevelValue, LogLevel } from '../logger';
import { safeStringify } from '../internal/safe-stringify';

interface FetchConfig {
  input: Parameters<typeof fetch>[0];
  init?: Omit<Parameters<typeof fetch>[1], 'body'>;
  autoFlush?: boolean | { durationMs: number };
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

    const flushDelay = typeof this.fetchConfig.autoFlush === 'boolean' ? 2000 : this.fetchConfig.autoFlush.durationMs;

    this.timer = setTimeout(() => {
      this.flush();
    }, flushDelay);
  };

  async flush() {
    if (this.events.length <= 0) {
      return;
    }

    const batch = this.events;
    this.events = [];

    let body: string;
    try {
      body = safeStringify(batch);
    } catch (err) {
      console.error('Failed to serialize log batch, dropping events:', err);
      return;
    }

    try {
      const res = await fetch(this.fetchConfig.input, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        ...this.fetchConfig.init,
        body,
      });
      if (!res.ok) {
        console.error(await res.text());
        this.events.unshift(...batch);
      }
    } catch (err) {
      console.error(err);
      this.events.unshift(...batch);
    }
  }

}
