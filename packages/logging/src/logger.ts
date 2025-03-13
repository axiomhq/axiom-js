import { defaultFormatters } from 'src/default-formatters';
import { Transport } from '.';
import { Version } from './runtime';

const LOG_LEVEL = 'info';

export interface LogEvent {
  level: string;
  message: string;
  fields: any;
  _time: string;
  '@app': {
    [key: FrameworkIdentifier['name']]: FrameworkIdentifier['version'];
  };
}

export const LogLevelValue = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  off: 100,
} as const;

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  off: 'off',
} as const;

export type LogLevelValue = (typeof LogLevelValue)[keyof typeof LogLevelValue];
export type LogLevel = keyof typeof LogLevelValue;

export type Formatter<T extends Record<string, any> = LogEvent, U extends Record<string, any> = LogEvent> = (
  logEvent: T,
) => U;

export type FrameworkIdentifier = {
  name: `${string}-version`;
  version: string;
};

export type LoggerConfig = {
  args?: { [key: string]: any };
  transports: [Transport, ...Transport[]];
  logLevel?: LogLevel;
  formatters?: Array<Formatter>;
  overrideDefaultFormatters?: boolean;
};

export class Logger {
  children: Logger[] = [];
  public logLevel: LogLevelValue = LogLevelValue.debug;
  public config: LoggerConfig;

  constructor(public initConfig: LoggerConfig) {
    // check if user passed a log level, if not the default init value will be used as is.
    if (this.initConfig.logLevel != undefined) {
      this.logLevel = LogLevelValue[this.initConfig.logLevel];
    } else if (LOG_LEVEL) {
      this.logLevel = LogLevelValue[LOG_LEVEL as LogLevel];
    }

    this.config = { ...initConfig };

    if (!this.config.overrideDefaultFormatters) {
      this.config.formatters = [...defaultFormatters, ...(this.config.formatters ?? [])];
    }
  }

  raw(log: any) {
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
    }

    if (typeof args === 'object' && args !== null && Object.keys(args).length > 0) {
      const parsedArgs = JSON.parse(JSON.stringify(args, jsonFriendlyErrorReplacer));
      logEvent.fields = { ...logEvent.fields, ...parsedArgs };
    } else if (args && args.length) {
      logEvent.fields = { ...logEvent.fields, args: args };
    }

    if (this.config.formatters && this.config.formatters.length > 0) {
      logEvent.fields = this.config.formatters.reduce((acc, formatter) => formatter(acc), logEvent.fields);
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

function jsonFriendlyErrorReplacer(_key: string, value: any) {
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
