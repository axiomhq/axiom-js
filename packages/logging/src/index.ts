import { Version } from './shared';
export interface Transport {
  log: (logs: LogEvent[]) => Promise<void> | void;
  flush: () => Promise<void> | void;
}

const LOG_LEVEL = 'info';

export interface LogEvent {
  level: string;
  message: string;
  fields: any;
  _time: string;
  '@app': {
    'axiom-logging-version': string;
  };
}

export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
  off = 100,
}

export const throttle = (fn: Function, wait: number) => {
  let lastFn: ReturnType<typeof setTimeout>, lastTime: number;
  return function (this: any) {
    const context = this,
      args = arguments;

    // First call, set lastTime
    if (lastTime == null) {
      lastTime = Date.now();
    }

    clearTimeout(lastFn);
    lastFn = setTimeout(
      () => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      },
      Math.max(wait - (Date.now() - lastTime), 0),
    );
  };
};

export type LoggerConfig = {
  args?: { [key: string]: any };
  transports: [Transport, ...Transport[]];
  logLevel?: LogLevel;
};

export class Logger {
  children: Logger[] = [];
  public logLevel: LogLevel = LogLevel.debug;
  public config: LoggerConfig;

  constructor(public initConfig: LoggerConfig) {
    // check if user passed a log level, if not the default init value will be used as is.
    if (this.initConfig.logLevel != undefined && this.initConfig.logLevel >= 0) {
      this.logLevel = this.initConfig.logLevel;
    } else if (LOG_LEVEL) {
      this.logLevel = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
    }
    this.config = { ...initConfig };
  }

  raw(log: LogEvent) {
    this.config.transports.forEach((transport) => transport.log([log]));
  }
  debug = (message: string, args: { [key: string]: any } = {}) => {
    this.log(LogLevel.debug, message, args);
  };
  info = (message: string, args: { [key: string]: any } = {}) => {
    this.log(LogLevel.info, message, args);
  };
  warn = (message: string, args: { [key: string]: any } = {}) => {
    this.log(LogLevel.warn, message, args);
  };
  error = (message: string, args: { [key: string]: any } = {}) => {
    this.log(LogLevel.error, message, args);
  };

  with = (args: { [key: string]: any }) => {
    const config = { ...this.config, args: { ...this.config.args, ...args } };
    const child = new Logger(config);
    this.children.push(child);
    return child;
  };

  private _transformEvent = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    const logEvent: LogEvent = {
      level: LogLevel[level].toString(),
      message,
      _time: new Date(Date.now()).toISOString(),
      fields: this.config.args || {},
      '@app': {
        'axiom-logging-version': Version ?? 'unknown',
      },
    };

    // check if passed args is an object, if its not an object, add it to fields.args
    if (args instanceof Error) {
      logEvent.fields = {
        ...logEvent.fields,
        message: args.message,
        stack: args.stack,
        name: args.name,
      };
    } else if (typeof args === 'object' && args !== null && Object.keys(args).length > 0) {
      const parsedArgs = JSON.parse(JSON.stringify(args, jsonFriendlyErrorReplacer));
      logEvent.fields = { ...logEvent.fields, ...parsedArgs };
    } else if (args && args.length) {
      logEvent.fields = { ...logEvent.fields, args: args };
    }

    return logEvent;
  };

  log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    this.config.transports.forEach((transport) => transport.log([this._transformEvent(level, message, args)]));
  };

  flush = async () => {
    const promises = [
      ...this.config.transports.map((transport) => transport.flush()),
      ...this.children.map((child) => child.flush()),
    ];

    await Promise.allSettled(promises);
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
