import 'cross-fetch/polyfill';
import { LogEvent } from '../logging/logger';
import { Transport } from '../logging/transport';
import { isBrowser, isVercel } from '../platform';
import throttle from '../common/throttle';

export class FetchTransport implements Transport {
  public logEvents: LogEvent[] = [];
  throttledSendLogs = throttle(this.sendLogs, 1000);

  constructor(public endpoint: string = 'https://api.axiom.co', public token?: string) {}

  async log(event: LogEvent): Promise<void> {
    this.logEvents.push(event);
    this.throttledSendLogs();
    return Promise.resolve();
  }

  async sendLogs() {
    if (!this.logEvents.length) {
      return;
    }

    const method = 'POST';
    const keepalive = true;
    const body = JSON.stringify(this.logEvents);
    // clear pending logs
    this.logEvents = [];
    // fire request to ingest logs
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const reqOptions: RequestInit = { body, method, keepalive, headers };

    // Do not leak network errors; does not affect the running app
    const sendFallback = async () => await fetch(this.endpoint, reqOptions).catch(console.error);

    try {
      if (typeof fetch === 'undefined') {
        await fetch(this.endpoint, reqOptions).catch(console.error);
      } else if (isBrowser() && isVercel() && navigator.sendBeacon) {
        // sendBeacon fails if message size is greater than 64kb, so
        // we fall back to fetch.
        if (!navigator.sendBeacon(this.endpoint, body)) {
          await sendFallback();
        }
      } else {
        await sendFallback();
      }
    } catch (e) {
      console.error(`Failed to send logs to Axiom: ${e}`);
    }
  }

  async flush() {
    return this.sendLogs();
  }
}
