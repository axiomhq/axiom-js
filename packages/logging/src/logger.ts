import { defaultFormatters } from 'src/default-formatters';
import { Transport } from '.';
import { Version } from './runtime';

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

/**
 * Options that can be passed to log methods.
 * Following the pattern of popular logging libraries like Pino and Winston.
 */
export type LogOptions = Record<string | symbol, any>;

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
  [EVENT]?: Record<string, any>;
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
   * @param options Log options that can include fields and a special ROOT symbol
   *
   * @example
   * // Add fields to the log event
   * logger.debug("User action", { userId: 123 });
   *
   * @example
   * // Add properties directly to the root of the log event using EVENT symbol
   * import { EVENT } from '@axiomhq/logging';
   * logger.debug("Custom debug log", {
   *   userId: 123,
   *   [EVENT]: {
   *     traceId: "abc123",
   *     _time: "2023-01-01T00:00:00Z"
   *   }
   * });
   */
  debug = (message: string, options: LogOptions = {}) => {
    this.log(LogLevel.debug, message, options);
  };

  /**
   * Log an info message
   * @param message The log message
   * @param options Log options that can include fields and a special ROOT symbol
   *
   * @example
   * // Add fields to the log event
   * logger.info("User logged in", { userId: 123 });
   *
   * @example
   * // Add properties directly to the root of the log event using EVENT symbol
   * import { EVENT } from '@axiomhq/logging';
   * logger.info("Request processed", {
   *   userId: 123,
   *   [EVENT]: {
   *     traceId: "abc123",
   *     service: "auth-service"
   *   }
   * });
   */
  info = (message: string, options: LogOptions = {}) => {
    this.log(LogLevel.info, message, options);
  };

  /**
   * Log a warning message
   * @param message The log message
   * @param options Log options that can include fields and a special ROOT symbol
   *
   * @example
   * // Add fields to the log event
   * logger.warn("Rate limit approaching", { requestCount: 950 });
   *
   * @example
   * // Add fields and root-level properties to the warning log
   * import { EVENT } from '@axiomhq/logging';
   * logger.warn("Service degradation", {
   *   component: "database",
   *   [EVENT]: {
   *     alertId: "warn-123",
   *     priority: "medium"
   *   }
   * });
   */
  warn = (message: string, options: LogOptions = {}) => {
    this.log(LogLevel.warn, message, options);
  };

  /**
   * Log an error message
   * @param message The log message
   * @param options Log options that can include fields and a special ROOT symbol
   *
   * @example
   * // Log an error with stack trace
   * try {
   *   // some code that throws
   * } catch (err) {
   *   logger.error("Operation failed", err);
   * }
   *
   * @example
   * // Add fields and root-level properties to the error log
   * import { EVENT } from '@axiomhq/logging';
   * logger.error("API request failed", {
   *   statusCode: 500,
   *   [EVENT]: {
   *     errorId: "err-123",
   *     severity: "high"
   *   }
   * });
   */
  error = (message: string, options: LogOptions | Error = {}) => {
    this.log(LogLevel.error, message, options);
  };

  /**
   * Create a child logger with additional context fields
   * @param fields Additional context fields to include in all logs from this logger
   *
   * @example
   * // Create a child logger with additional fields
   * const childLogger = logger.with({ userId: 123 });
   *
   * @example
   * // Create a child logger with fields and root-level properties
   * import { EVENT } from '@axiomhq/logging';
   * const childLogger = logger.with({
   *   userId: 123,
   *   [EVENT]: {
   *     traceId: "abc123",
   *     service: "auth-service"
   *   }
   * });
   */
  with = (fields: Record<string | symbol, any>) => {
    const config = { ...this.config };

    // Handle special ROOT symbol for child loggers
    if (fields[EVENT] && typeof fields[EVENT] === 'object') {
      // Store root properties separately to be applied directly to log events
      config[EVENT] = { ...(config[EVENT] || {}), ...fields[EVENT] };
      delete fields[EVENT];
    }

    // Handle regular fields
    config.args = { ...this.config.args, ...fields };

    const child = new Logger(config);
    this.children.push(child);
    return child;
  };

  private _transformEvent = (level: LogLevel, message: string, options: LogOptions | Error = {}) => {
    const logEvent: LogEvent = {
      level: LogLevel[level].toString(),
      message,
      _time: new Date(Date.now()).toISOString(),
      fields: this.config.args || {},
      '@app': {
        'axiom-logging-version': Version ?? 'unknown',
      },
    };

    // Apply root properties from logger config if present
    if (this.config[EVENT] && typeof this.config[EVENT] === 'object') {
      Object.assign(logEvent, this.config[EVENT]);
    }

    // Handle Error objects
    if (options instanceof Error) {
      logEvent.fields = {
        ...logEvent.fields,
        error: {
          message: options.message,
          stack: options.stack,
          name: options.name,
        },
      };
    }
    // Handle options object
    else if (typeof options === 'object' && options !== null) {
      // Extract root properties before JSON serialization (since symbols are lost in JSON.stringify)
      const rootProps = (options as Record<symbol, any>)[EVENT];

      // Create a copy of options without the ROOT symbol
      const optionsCopy = { ...options };
      delete (optionsCopy as any)[EVENT];

      // Process regular fields
      const parsedOptions = JSON.parse(JSON.stringify(optionsCopy, jsonFriendlyErrorReplacer));

      // Apply root properties directly to the root of logEvent
      if (rootProps && typeof rootProps === 'object') {
        Object.assign(logEvent, rootProps);
      }

      // Any remaining properties in options are treated as fields
      if (Object.keys(parsedOptions).length > 0) {
        logEvent.fields = { ...logEvent.fields, ...parsedOptions };
      }
    }
    // Handle array-like values
    else if (Array.isArray(options)) {
      logEvent.fields = { ...logEvent.fields, data: options };
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
  log = (level: LogLevel, message: string, options: LogOptions | Error = {}) => {
    this.config.transports.forEach((transport) => transport.log([this._transformEvent(level, message, options)]));
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
