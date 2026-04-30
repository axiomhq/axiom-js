import { Logger, LogEvent, LogLevel, Formatter, EVENT } from '../../src/logger';
import type { StandardSchemaV1 } from '../../src/standard-schema';
import { describe, beforeEach, afterEach, it, expect, expectTypeOf, vi } from 'vitest';
import { MockTransport } from '../lib/mock';

function createSchema<Input extends Record<string, any>, Output extends Record<string, any> = Input>(
  validate: (value: unknown) => StandardSchemaV1.Result<Output> | Promise<StandardSchemaV1.Result<Output>>,
): StandardSchemaV1<Input, Output> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate,
    },
  };
}

describe('Logger', () => {
  let mockTransport: MockTransport;
  let logger: Logger<any, any>;

  beforeEach(() => {
    mockTransport = new MockTransport();
    logger = new Logger({
      transports: [mockTransport],
    });
  });

  afterEach(() => {
    mockTransport.clear();
  });

  describe('formatters', () => {
    it('should format fields', () => {
      const formatter: Formatter = (logEvent) => {
        return {
          ...logEvent,
          fields: {
            ...logEvent.fields,
            userId: '123',
          },
        };
      };

      logger = new Logger({
        transports: [mockTransport],
        formatters: [formatter],
      });

      logger.info('user action');

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({ userId: '123' });
    });

    it('should replace and delete fields', () => {
      const formatter: Formatter = (logEvent) => {
        return {
          ...logEvent,
          fields: {
            userId: logEvent.fields.userId,
            foo: logEvent.fields.foo,
          },
        };
      };

      logger = new Logger({
        transports: [mockTransport],
        formatters: [formatter],
      });

      logger.info('user action', {
        userId: '123',
        action: 'login',
        foo: 'bar',
        baz: 'qux',
      });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({ userId: '123', foo: 'bar' });
    });
  });

  describe('with method', () => {
    it('should create child logger with merged args', () => {
      const childLogger = logger.with({ userId: '123' });
      childLogger.info('user action');

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({
        userId: '123',
      });
    });

    it('should merge multiple with calls', () => {
      const childLogger = logger.with({ userId: '123' }).with({ action: 'login' });

      childLogger.info('user login');

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({
        userId: '123',
        action: 'login',
      });
    });

    it('should merge multiple with calls with symbols', () => {
      const childLogger = logger.with({ userId: '123' }).with({ action: 'login', [EVENT]: { foo: 'bar' } });

      childLogger.info('user login');

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({
        userId: '123',
        action: 'login',
      });
      expect(mockTransport.logs[0]).toMatchObject({ foo: 'bar' });
    });
  });

  describe('error handling', () => {
    it('should properly format Error objects', () => {
      const error = new Error('test error');
      logger.error('An error occurred', error);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toMatchObject({
        message: 'test error',
        name: 'Error',
        stack: expect.any(String),
      });
    });

    it('should handle custom error properties', () => {
      const customError = new Error('custom error');
      (customError as any).code = 'CUSTOM_ERROR';

      logger.error('Custom error occurred', customError);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toMatchObject({
        message: 'custom error',
        code: 'CUSTOM_ERROR',
        name: 'Error',
        stack: expect.any(String),
      });
    });
  });

  describe('flush', () => {
    it('should flush all transports', async () => {
      const mockTransport2 = new MockTransport();
      const multiLogger = new Logger({
        transports: [mockTransport, mockTransport2],
      });

      const flushSpy1 = vi.spyOn(mockTransport, 'flush');
      const flushSpy2 = vi.spyOn(mockTransport2, 'flush');

      await multiLogger.flush();

      expect(flushSpy1).toHaveBeenCalled();
      expect(flushSpy2).toHaveBeenCalled();
    });

    it('should flush child loggers', async () => {
      logger.with({}).log(LogLevel.info, 'child message');
      const flushSpy = vi.spyOn(mockTransport, 'flush');

      await logger.flush();

      expect(flushSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Root fields injection using EVENT symbol', () => {
    it('should inject root fields into log events', () => {
      logger.info('user action', { [EVENT]: { userId: '123' } });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toMatchObject({ userId: '123' });
    });

    it('should inject root fields into child loggers', () => {
      const childLogger = logger.with({ userId: '123' });
      childLogger.info('user action', { [EVENT]: { action: 'login' } });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toMatchObject({ action: 'login' });
      expect(mockTransport.logs[0].fields).toEqual({ userId: '123' });
    });

    it('should handle both root and and normal fields', () => {
      logger.info('user action', { [EVENT]: { userId: '123' }, userName: 'John Doe' });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toMatchObject({ userId: '123' });
      expect(mockTransport.logs[0].fields).toEqual({ userName: 'John Doe' });
    });
  });

  describe('schema validation', () => {
    it('should ingest logs that pass input schema validation and use validated fields', () => {
      const schema = createSchema<{ userId: string }, { userId: number }>((value) => {
        const fields = value as Record<string, unknown>;
        if (typeof fields.userId === 'string') {
          return { value: { userId: Number(fields.userId) } };
        }

        return { issues: [{ message: 'userId must be a string' }] };
      });

      logger = new Logger({
        transports: [mockTransport],
        schema,
      });

      logger.info('user action', { userId: '42' });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({ userId: 42 });
    });

    it('should drop invalid input logs and call onValidationError', () => {
      const onValidationError = vi.fn();
      const schema = createSchema<{ userId: string }>(() => ({
        issues: [{ message: 'Invalid payload' }],
      }));

      logger = new Logger({
        transports: [mockTransport],
        schema,
        onValidationError,
      });

      logger.info('user action', { userId: 123 } as any);

      expect(mockTransport.logs).toHaveLength(0);
      expect(onValidationError).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'input',
          reason: 'validation-failed',
          level: LogLevel.info,
          message: 'user action',
          value: { userId: 123 },
        }),
      );
    });

    it('should drop logs when input schema validation is async', () => {
      const onValidationError = vi.fn();
      const schema = createSchema<{ userId: string }>(() => Promise.resolve({ value: { userId: '123' } }));

      logger = new Logger({
        transports: [mockTransport],
        schema,
        onValidationError,
      });

      logger.info('user action', { userId: '123' });

      expect(mockTransport.logs).toHaveLength(0);
      expect(onValidationError).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'input',
          reason: 'async-unsupported',
          value: { userId: '123' },
        }),
      );
    });

    it('should validate fields produced by error logs', () => {
      const schema = createSchema<{ message: string; name: string; stack: string }>((value) => {
        const fields = value as Record<string, unknown>;
        if (
          typeof fields.message === 'string' &&
          typeof fields.name === 'string' &&
          typeof fields.stack === 'string'
        ) {
          return {
            value: {
              message: fields.message,
              name: fields.name,
              stack: fields.stack,
            },
          };
        }

        return { issues: [{ message: 'Invalid error fields' }] };
      });

      logger = new Logger({
        transports: [mockTransport],
        schema,
      });

      logger.error('Operation failed', new Error('test error'));

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toMatchObject({
        message: 'test error',
        name: 'Error',
        stack: expect.any(String),
      });
    });

    it('should include with() context in input schema validation', () => {
      const schema = createSchema<{ requestId: string; userId: string }>((value) => {
        const fields = value as Record<string, unknown>;
        if (typeof fields.requestId === 'string' && typeof fields.userId === 'string') {
          return { value: { requestId: fields.requestId, userId: fields.userId } };
        }

        return { issues: [{ message: 'Invalid request context' }] };
      });

      logger = new Logger({
        transports: [mockTransport],
        schema,
      });

      const requestLogger = logger.with({ requestId: 'req-1' });
      requestLogger.info('user action', { userId: 'user-1' });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({ requestId: 'req-1', userId: 'user-1' });
    });

    it('should validate outputSchema after formatters', () => {
      const schema = createSchema<{ userId: string }, { userId: number }>((value) => {
        const fields = value as Record<string, unknown>;
        if (typeof fields.userId === 'string') {
          return { value: { userId: Number(fields.userId) } };
        }

        return { issues: [{ message: 'Invalid input' }] };
      });

      const outputSchema = createSchema<{ eventName: string; userId: number }>((value) => {
        const event = value as Record<string, unknown>;
        if (event.eventName === 'user action' && typeof event.userId === 'number') {
          return { value: { eventName: event.eventName, userId: event.userId } };
        }

        return { issues: [{ message: 'Invalid output' }] };
      });

      logger = new Logger({
        transports: [mockTransport],
        schema,
        outputSchema,
        formatters: [
          (logEvent) => ({
            eventName: logEvent.message,
            userId: logEvent.fields.userId,
          }),
        ],
      });

      logger.info('user action', { userId: '7' });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toEqual({ eventName: 'user action', userId: 7 });
    });

    it('should drop invalid output logs and call onValidationError', () => {
      const onValidationError = vi.fn();
      const outputSchema = createSchema<{ eventName: string }>(() => ({
        issues: [{ message: 'Invalid output event' }],
      }));

      logger = new Logger({
        transports: [mockTransport],
        outputSchema,
        onValidationError,
        formatters: [
          (logEvent) => ({
            eventName: logEvent.message,
          }),
        ],
      });

      logger.info('user action');

      expect(mockTransport.logs).toHaveLength(0);
      expect(onValidationError).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'output',
          reason: 'validation-failed',
          value: { eventName: 'user action' },
        }),
      );
    });
  });

  describe('schema typing', () => {
    it('should infer field args from schema input and reject invalid literals', () => {
      const schema = createSchema<{ userId: string; attempt?: number }>((value) => ({
        value: value as { userId: string; attempt?: number },
      }));

      const typedLogger = new Logger({
        transports: [mockTransport],
        schema,
      });

      typedLogger.info('user action', { userId: '123' });
      typedLogger.info('user action', { userId: '123', attempt: 1, [EVENT]: { traceId: 'abc' } });

      // @ts-expect-error userId must be a string
      typedLogger.info('user action', { userId: 123 });
      // @ts-expect-error unknown is not part of the schema input
      typedLogger.info('user action', { userId: '123', unknown: true });

      const childLogger = typedLogger.with({ userId: '123' });
      childLogger.info('user action');

      expectTypeOf(typedLogger.config.schema).toEqualTypeOf<typeof schema | undefined>();
    });
  });

  describe('raw logging', () => {
    it('should pass raw log events directly to transport', () => {
      const rawEvent: LogEvent = {
        level: 'info',
        message: 'raw message',
        fields: { custom: 'field' },
        _time: new Date().toISOString(),
        '@app': {
          'axiom-logging-version': 'test',
        },
        source: 'test',
      };

      logger.raw(rawEvent);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toEqual(rawEvent);
    });

    it('should bypass schema and outputSchema validation for raw logs', () => {
      const schema = createSchema<{ userId: string }>(() => ({
        issues: [{ message: 'Always invalid' }],
      }));

      logger = new Logger({
        transports: [mockTransport],
        schema,
        outputSchema: schema,
      });

      const rawEvent: LogEvent = {
        level: 'info',
        message: 'raw message',
        fields: { custom: 'field' },
        _time: new Date().toISOString(),
        '@app': {
          'axiom-logging-version': 'test',
        },
        source: 'test',
      };

      logger.raw(rawEvent);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toEqual(rawEvent);
    });
  });
});
