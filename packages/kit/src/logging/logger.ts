import { LogLevel, DEFAULT_LOG_LEVEL, resolveLogLevelFromString } from './levels';
import { LoggerConfig } from './config';

export interface LogEvent {
  level: string;
  message: string;
  fields: { [key: string]: any };
  _time: string;
  [key: string]: any;
}

export class Logger {
  children: Logger[] = [];
  public logLevel: LogLevel;

  constructor(public config: LoggerConfig) {
    this.logLevel = config.logLevel
      ? resolveLogLevelFromString(config.logLevel)
      : resolveLogLevelFromString(DEFAULT_LOG_LEVEL || 'debug');
  }

  debug = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.debug, message, args);
  };
  info = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.info, message, args);
  };
  warn = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.warn, message, args);
  };
  error = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.error, message, args);
  };

  with = (args: { [key: string]: any }) => {
    const child = new Logger({ ...this.config, args: { ...this.config.args, ...args } });
    this.children.push(child);
    return child;
  };

  _log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    if (level < this.logLevel) {
      return;
    }
    const logEvent: LogEvent = {
      level: LogLevel[level],
      message,
      _time: new Date(Date.now()).toISOString(),
      fields: this.config.args || {},
    };

    // check if passed args is an object, if its not an object, add it to fields.args
    if (args instanceof Error) {
      logEvent.fields = { ...logEvent.fields, message: args.message, stack: args.stack, name: args.name };
    } else if (typeof args === 'object' && args !== null && Object.keys(args).length > 0) {
      const parsedArgs = JSON.parse(JSON.stringify(args, jsonFriendlyErrorReplacer));
      logEvent.fields = { ...logEvent.fields, ...parsedArgs };
    } else if (args && args.length) {
      logEvent.fields = { ...logEvent.fields, args: args };
    }

    this.config.transport.log(logEvent);
  };

  async flush() {
    await Promise.all([this.config.transport.flush(), ...this.children.map((c) => c.flush())]);
  }
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
