import { defaultFormatters } from 'src/default-formatters';
import { Transport } from '.';
import { Version, isBrowser } from './runtime';

const LOG_LEVEL = 'info';

/**
 * Symbol used to specify properties that should be added to the root of the log event
 * rather than to the fields property.
 *
 * @example
 * const EVENT = Symbol.for('logging.event');
 * logger.info("User logged in", {
 *   userId: 123,
 *   [EVENT]: { traceId: "abc123" }
 * });
 */
export const EVENT = Symbol.for('logging.event');

/**
 * LogEvent interface representing a log entry.
 * This interface defines the structure of log events processed by the logger.
 */
export interface LogEvent extends Record<string, any> {
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
  args?: Record<string | symbol, any>;
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

  /**
   * Log a debug message
   * @param message The log message
   * @param options Log options that can include fields and a special EVENT symbol
   *
   * @example
   * // Add fields to the log event
   * logger.debug("User action", { userId: 123 });
   */
  debug = (message: string, args: Record<string | symbol, any> = {}) => {
    this.log(LogLevel.debug, message, args);
  };

  /**
   * Log an info message
   * @param message The log message
   * @param options Log options that can include fields and a special EVENT symbol
   *
   * @example
   * // Add fields to the log event
   * logger.info("User logged in", { userId: 123 });
   */
  info = (message: string, args: Record<string | symbol, any> = {}) => {
    this.log(LogLevel.info, message, args);
  };

  /**
   * Log a warning message
   * @param message The log message
   * @param options Log options that can include fields and a special EVENT symbol
   *
   * @example
   * // Add fields to the log event
   * logger.warn("Rate limit approaching", { requestCount: 950 });
   */
  warn = (message: string, args: Record<string | symbol, any> = {}) => {
    this.log(LogLevel.warn, message, args);
  };

  /**
   * Log an error message
   * @param message The log message
   * @param options Log options that can include fields and a special EVENT symbol
   *
   * @example
   * // Log an error with stack trace
   * try {
   *   // some code that throws
   * } catch (err) {
   *   logger.error("Operation failed", err);
   * }
   */
  error = (message: string, args: Record<string | symbol, any> = {}) => {
    this.log(LogLevel.error, message, args);
  };

  /**
   * Create a child logger with additional context fields
   * @param fields Additional context fields to include in all logs from this logger
   *
   * @example
   * // Create a child logger with additional fields
   * const childLogger = logger.with({ userId: 123 });
   */
  with = (fields: Record<string | symbol, any>) => {
    const { [EVENT]: argsEventFields, ...argsRest } = this.config.args ?? {};
    const { [EVENT]: _eventFields, ...rest } = fields;

    const eventFields = { ...(argsEventFields ?? {}), ...(_eventFields ?? {}) };

    const childConfig = { ...this.config, args: { ...argsRest, ...rest, [EVENT]: eventFields } };

    const child = new Logger(childConfig);
    this.children.push(child);
    return child;
  };

  private _transformEvent = (level: LogLevel, message: string, args: Record<string | symbol, any> = {}) => {
    let rootFields = {};
    let fields = this.config.args ?? {};
    if (this.config.args && EVENT in this.config.args) {
      const { [EVENT]: argsEventFields, ...argsRest } = this.config.args ?? {};
      rootFields = { ...(argsEventFields ?? {}) };
      fields = argsRest;
    }

    const logEvent: LogEvent = {
      level: LogLevel[level].toString(),
      message,
      _time: new Date(Date.now()).toISOString(),
      fields: fields,
      '@app': {
        'axiom-logging-version': Version ?? 'unknown',
      },
      source: isBrowser ? 'browser-log' : 'server-log',
    };

    // Apply root properties from logger config if present
    if (rootFields && typeof rootFields === 'object') {
      Object.assign(logEvent, rootFields);
    }

    // Handle Error objects
    if (args instanceof Error) {
      logEvent.fields = {
        ...logEvent.fields,
        message: args.message,
        stack: args.stack,
        name: args.name,
      };
    }

    if (typeof args === 'object' && args !== null) {
      // Extract root properties before JSON serialization (since symbols are lost in JSON.stringify)
      const { [EVENT]: rootArgs, ...fieldArgs } = args as Record<string | symbol, any>;

      // Process regular fields
      const parsedArgs = JSON.parse(JSON.stringify(fieldArgs, jsonFriendlyErrorReplacer));

      // Apply root properties directly to the root of logEvent
      if (rootArgs && typeof rootArgs === 'object' && rootArgs !== null) {
        Object.assign(logEvent, rootArgs);
      }

      // Any remaining properties in options are treated as fields
      if (Object.keys(parsedArgs).length > 0) {
        logEvent.fields = { ...logEvent.fields, ...parsedArgs };
      }
      // Handle array-like values
    } else if (Array.isArray(args)) {
      logEvent.fields = { ...logEvent.fields, args: args };
    }

    if (this.config.formatters && this.config.formatters.length > 0) {
      // Apply formatters to the entire logEvent
      return this.config.formatters.reduce((acc, formatter) => formatter(acc), logEvent);
    }

    return logEvent;
  };

  /**
   * Log a message with the specified level
   * @param level The log level
   * @param message The log message
   * @param options Log options or Error object
   */
  log = (level: LogLevel, message: string, args: Record<string | symbol, any> = {}) => {
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
