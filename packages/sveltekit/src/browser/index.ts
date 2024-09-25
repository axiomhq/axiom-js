import { AxiomLogger, LogLevel } from "../logger";

export class Logger implements AxiomLogger {
  public logEvents: LogEvent[] = [];
  children: Logger[] = [];
  public logLevel: LogLevel = LogLevel.DEBUG;
  public config: LoggerConfig = {
  };

  constructor(public initConfig: LoggerConfig = {}) {
    this.config = { ...this.config, ...initConfig };
  }


  debug = (message: string, args: { [key: string]: any } = {}) => {
    return this.log(LogLevel.DEBUG, message, args);
  };
  info = (message: string, args: { [key: string]: any } = {}) => {
    return this.log(LogLevel.INFO, message, args);
  };
  warn = (message: string, args: { [key: string]: any } = {}) => {
    return this.log(LogLevel.WARN, message, args);
  };
  error = (message: string, args: { [key: string]: any } = {}) => {
    return this.log(LogLevel.ERROR, message, args);
  };

  with = (args: { [key: string]: any }) => {
    const config = { ...this.config, args: { ...this.config.args, ...args } };
    const child = new Logger(config);
    this.children.push(child);
    return child;
  };

  private _transformEvent = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    let logEvent: LogEvent = {
      level: LogLevel[level],
      message: message,
      _time: new Date(Date.now()).toISOString(),
      ...this.config.args,
    };

    // check if passed args is an object, if its not an object, add it to fields.args
    if (args instanceof Error) {
      logEvent = { ...logEvent, message: args.message, stack: args.stack, name: args.name };
    } else if (typeof args === 'object' && args !== null && Object.keys(args).length > 0) {
      const parsedArgs = JSON.parse(JSON.stringify(args, jsonFriendlyErrorReplacer));
      logEvent = { ...logEvent, ...parsedArgs };
    } else if (args && args.length) {
      logEvent = { ...logEvent, ...args };
    }

    logEvent.runtime = 'browser';

    return logEvent;
  };

  log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    if (level < this.logLevel) {
      return Promise.resolve();
    }
    const logEvent = this._transformEvent(level, message, args);

    this.logEvents.push(logEvent);

    return Promise.resolve();
  };


  async sendLogs() {
    if (!this.logEvents.length) {
      return;
    }

    // if running in browser, proxy the logs to the API route created by user in their app
    // defaults to: '/api/axiom'
    fetch('/api/axiom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.logEvents),
    }).catch((e) => {
      console.warn(`Failed to send logs to Axiom: ${e}`);
      // put the log events back in the queue
      this.logEvents = [...this.logEvents];
    })

  }

  flush = async () => {
    await Promise.all([this.sendLogs(), ...this.children.map((c) => c.flush())]);
  };
}

function jsonFriendlyErrorReplacer(key: string, value: any) {
  if (value instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors
      ...value,
      // Explicitly pull Error's non-enumerable properties
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

export interface LogEvent {
  _time: string;
  level: string;
  message: string;
  [key: string]: any;
}

export type LoggerConfig = {
  args?: { [key: string]: any };
  url?: string;
};
