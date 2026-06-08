import { defaultFormatters } from 'src/default-formatters';
import { Transport } from '.';
import { Version, isBrowser } from './runtime';
import type { StandardSchemaV1 } from './standard-schema';

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
  source: string;
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

export type LoggerSchema = StandardSchemaV1<Record<string, any>, Record<string, any>>;
export type OutputLoggerSchema = StandardSchemaV1<any, any>;

type FieldsInput<TSchema extends LoggerSchema | undefined> = TSchema extends LoggerSchema
  ? StandardSchemaV1.InferInput<TSchema>
  : Record<string, any>;

type FieldsOutput<TSchema extends LoggerSchema | undefined> = TSchema extends LoggerSchema
  ? StandardSchemaV1.InferOutput<TSchema>
  : Record<string, any>;

type OutputValue<TOutputSchema extends OutputLoggerSchema | undefined> = TOutputSchema extends OutputLoggerSchema
  ? StandardSchemaV1.InferOutput<TOutputSchema>
  : LogEvent;

export type LoggerArgs<TSchema extends LoggerSchema | undefined = undefined> = FieldsInput<TSchema> &
  Record<symbol, any>;

export type ValidationErrorReason = 'validation-failed' | 'async-unsupported' | 'validation-threw';
export type ValidationStage = 'input' | 'output';

export type ValidationErrorContext<
  TSchema extends LoggerSchema | undefined = undefined,
  TOutputSchema extends OutputLoggerSchema | undefined = undefined,
> = {
  stage: ValidationStage;
  reason: ValidationErrorReason;
  level: LogLevel;
  message: string;
  value: unknown;
  issues?: ReadonlyArray<StandardSchemaV1.Issue>;
  error?: unknown;
  schema: TSchema | TOutputSchema;
};

export type LoggerConfig<
  TSchema extends LoggerSchema | undefined = undefined,
  TOutputSchema extends OutputLoggerSchema | undefined = undefined,
> = {
  args?: LoggerArgs<TSchema>;
  transports: [Transport, ...Transport[]];
  logLevel?: LogLevel;
  formatters?: Array<Formatter<any, any>>;
  overrideDefaultFormatters?: boolean;
  schema?: TSchema;
  outputSchema?: TOutputSchema;
  onValidationError?: (context: ValidationErrorContext<TSchema, TOutputSchema>) => void;
};

export class Logger<
  TSchema extends LoggerSchema | undefined = undefined,
  TOutputSchema extends OutputLoggerSchema | undefined = undefined,
> {
  children: Logger<TSchema, TOutputSchema>[] = [];
  public logLevel: LogLevelValue = LogLevelValue.debug;
  public config: LoggerConfig<TSchema, TOutputSchema>;

  constructor(public initConfig: LoggerConfig<TSchema, TOutputSchema>) {
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
  debug = (message: string, args: LoggerArgs<TSchema> = {} as LoggerArgs<TSchema>) => {
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
  info = (message: string, args: LoggerArgs<TSchema> = {} as LoggerArgs<TSchema>) => {
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
  warn = (message: string, args: LoggerArgs<TSchema> = {} as LoggerArgs<TSchema>) => {
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
  error = (message: string, args: LoggerArgs<TSchema> | Error = {} as LoggerArgs<TSchema>) => {
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
  with = (fields: LoggerArgs<TSchema>) => {
    const { eventFields: argsEventFields, fields: argsRest } = extractEventFields(
      this.config.args as Record<string | symbol, any> | undefined,
    );
    const { eventFields: inputEventFields, fields: rest } = extractEventFields(fields as Record<string | symbol, any>);

    const eventFields = {
      ...((argsEventFields && typeof argsEventFields === 'object' ? argsEventFields : {}) as Record<string, any>),
      ...((inputEventFields && typeof inputEventFields === 'object'
        ? inputEventFields
        : {}) as Record<string, any>),
    };

    const childArgs = { ...argsRest, ...rest, [EVENT]: eventFields } as unknown as LoggerArgs<TSchema>;
    const childConfig: LoggerConfig<TSchema, TOutputSchema> = { ...this.config, args: childArgs };

    const child = new Logger(childConfig);
    this.children.push(child);
    return child;
  };

  private _notifyValidationError = (
    stage: ValidationStage,
    reason: ValidationErrorReason,
    level: LogLevel,
    message: string,
    schema: TSchema | TOutputSchema,
    value: unknown,
    details: Pick<ValidationErrorContext<TSchema, TOutputSchema>, 'issues' | 'error'> = {},
  ) => {
    this.config.onValidationError?.({
      stage,
      reason,
      level,
      message,
      schema,
      value,
      ...details,
    });
  };

  private _validate = <TOutput>(
    stage: ValidationStage,
    schema: StandardSchemaV1<unknown, TOutput> | undefined,
    level: LogLevel,
    message: string,
    value: unknown,
  ): { success: true; value: TOutput } | { success: false } => {
    if (!schema) {
      return { success: true, value: value as TOutput };
    }

    try {
      const result = schema['~standard'].validate(value);

      if (isPromiseLike(result)) {
        this._notifyValidationError(stage, 'async-unsupported', level, message, schema as TSchema | TOutputSchema, value);
        return { success: false };
      }

      if (result.issues) {
        this._notifyValidationError(stage, 'validation-failed', level, message, schema as TSchema | TOutputSchema, value, {
          issues: result.issues,
        });
        return { success: false };
      }

      return { success: true, value: result.value };
    } catch (error) {
      this._notifyValidationError(stage, 'validation-threw', level, message, schema as TSchema | TOutputSchema, value, {
        error,
      });
      return { success: false };
    }
  };

  private _transformEvent = (
    level: LogLevel,
    message: string,
    args: LoggerArgs<TSchema> | Error = {} as LoggerArgs<TSchema>,
  ) => {
    const { eventFields: argsEventFields, fields } = extractEventFields(
      this.config.args as Record<string | symbol, any> | undefined,
    );
    const rootFields =
      argsEventFields && typeof argsEventFields === 'object' ? (argsEventFields as Record<string, any>) : {};
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
      const { eventFields: rootArgs, fields: fieldArgs } = extractEventFields(args as Record<string | symbol, any>);

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

    const inputValidation = this._validate<FieldsOutput<TSchema>>(
      'input',
      this.config.schema as StandardSchemaV1<unknown, FieldsOutput<TSchema>> | undefined,
      level,
      message,
      logEvent.fields,
    );
    if (!inputValidation.success) {
      return null;
    }

    logEvent.fields = inputValidation.value;

    let formattedEvent: Record<string, any> = logEvent;
    if (this.config.formatters && this.config.formatters.length > 0) {
      // Apply formatters to the entire logEvent
      formattedEvent = this.config.formatters.reduce((acc, formatter) => formatter(acc), logEvent);
    }

    const outputValidation = this._validate<OutputValue<TOutputSchema>>(
      'output',
      this.config.outputSchema as StandardSchemaV1<unknown, OutputValue<TOutputSchema>> | undefined,
      level,
      message,
      formattedEvent,
    );
    if (!outputValidation.success) {
      return null;
    }

    return outputValidation.value;
  };

  /**
   * Log a message with the specified level
   * @param level The log level
   * @param message The log message
   * @param options Log options or Error object
   */
  log = (level: LogLevel, message: string, args: LoggerArgs<TSchema> | Error = {} as LoggerArgs<TSchema>) => {
    const event = this._transformEvent(level, message, args);

    if (!event) {
      return;
    }

    this.config.transports.forEach((transport) => transport.log([event]));
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

function extractEventFields(args: Record<string | symbol, any> | undefined) {
  const fields = { ...(args ?? {}) };
  const eventFields = fields[EVENT];
  delete fields[EVENT];

  return { eventFields, fields };
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
