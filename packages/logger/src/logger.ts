import { LogEvent } from './event';
import { LOG_LEVEL, LogLevel } from './levels';
import { Transport } from './transport';
import { Transformer } from './transformer';

export type LoggerConfig = {
  logLevel: LogLevel;
  autoFlush: boolean;
  transport: Transport;
  transformers: Transformer[];
  args?: { [key: string]: any };
};

export class Logger {
  children: Logger[] = [];

  constructor(public config: LoggerConfig) {
    if (this.config.logLevel == undefined || this.config.logLevel < 0) {
      this.config.logLevel = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
    }
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
  fatal = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.fatal, message, args);
  };

  with = (args: { [key: string]: any }) => {
    const config = { ...this.config, args: { ...this.config.args, ...args } };
    const child = new Logger(config);
    this.children.push(child);
    return child;
  };

  _log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    if (level < this.config.logLevel) {
      return;
    }
    let logEvent: LogEvent = {
      level: LogLevel[level].toString(),
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

    // loop over transformers and apply them to the logEvent
    for (let t of this.config.transformers) {
      logEvent = t.transform(logEvent);
    }

    this.config.transport.log(logEvent);
    if (this.config.autoFlush) {
      this.flush();
    }
  };

  flush = async () => {
    await Promise.all([this.config.transport.flush(), ...this.children.map((c) => c.flush())]);
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
