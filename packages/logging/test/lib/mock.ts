import { LogEvent } from '../../src';
import { Transport } from '../../src';

export const createLogEvent = (
  level: string = 'info',
  message: string = 'test message',
  fields: any = {},
): LogEvent => ({
  level,
  message,
  fields,
  _time: new Date().toISOString(),
  '@app': {
    'axiom-logging-version': 'test',
  },
});

export class MockTransport implements Transport {
  public logs: LogEvent[] = [];

  log(events: LogEvent[]) {
    this.logs.push(...events);
  }

  async flush() {
    return Promise.resolve();
  }

  clear() {
    this.logs = [];
  }
}
