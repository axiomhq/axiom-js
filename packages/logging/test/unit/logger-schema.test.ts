import { z } from 'zod';
import { Logger, LogLevel, EVENT } from '../../src/logger';
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

describe('Logger schema validation', () => {
  let mockTransport: MockTransport;
  let logger: Logger<any, any>;

  beforeEach(() => {
    mockTransport = new MockTransport();
  });

  afterEach(() => {
    mockTransport.clear();
  });

  describe('Zod', () => {
    it('should validate and transform input fields', () => {
      const schema = z
        .object({
          userId: z.string().transform(Number),
        })
        .strict();

      logger = new Logger({
        transports: [mockTransport],
        schema,
      });

      logger.info('user action', { userId: '42' });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].fields).toEqual({ userId: 42 });
    });

    it('should validate formatted output', () => {
      const schema = z
        .object({
          userId: z.string().transform(Number),
        })
        .strict();
      const outputSchema = z
        .object({
          eventName: z.string(),
          userId: z.number(),
        })
        .strict();

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

    it('should drop invalid input and report Zod issues', () => {
      const onValidationError = vi.fn();
      const schema = z.object({ userId: z.string() }).strict();

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
          issues: expect.arrayContaining([
            expect.objectContaining({
              path: ['userId'],
            }),
          ]),
        }),
      );
    });
  });

  describe('Standard Schema', () => {
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

      // @ts-expect-error userId is required by the schema
      typedLogger.info('user action');
      // @ts-expect-error userId must be a string
      typedLogger.info('user action', { userId: 123 });
      // @ts-expect-error unknown is not part of the schema input
      typedLogger.info('user action', { userId: '123', unknown: true });

      const childLogger = typedLogger.with({ userId: '123' });
      childLogger.info('user action');

      const consumeLogger = (_logger: Logger) => {};
      consumeLogger(typedLogger);

      expectTypeOf(typedLogger.config.schema).toEqualTypeOf<typeof schema | undefined>();
    });

    it('should infer field args from a Zod schema', () => {
      const schema = z.object({
        userId: z.string(),
        attempt: z.number().optional(),
      });
      const typedLogger = new Logger({
        transports: [mockTransport],
        schema,
      });

      typedLogger.info('user action', { userId: '123' });
      typedLogger.info('user action', { userId: '123', attempt: 1 });

      // @ts-expect-error userId is required by the Zod schema
      typedLogger.info('user action');
      // @ts-expect-error userId must be a string
      typedLogger.info('user action', { userId: 123 });
    });

    it('should follow Zod unknown-key policies for child context', () => {
      const strictLogger = new Logger({
        transports: [mockTransport],
        schema: z.object({ userId: z.string() }).strict(),
      });
      const passthroughLogger = new Logger({
        transports: [mockTransport],
        schema: z.object({ userId: z.string() }).passthrough(),
      });
      const catchallLogger = new Logger({
        transports: [mockTransport],
        schema: z.object({ userId: z.string() }).catchall(z.string()),
      });

      // @ts-expect-error strict schemas reject undeclared context fields
      strictLogger.with({ requestId: 'req-1' });

      const passthroughChild = passthroughLogger.with({ requestId: 'req-1' });
      passthroughChild.info('user action', { userId: 'user-1' });

      const catchallChild = catchallLogger.with({ requestId: 'req-1' });
      catchallChild.info('user action', { userId: 'user-1' });

      expect(mockTransport.logs).toHaveLength(2);
      expect(mockTransport.logs[0].fields).toEqual({ requestId: 'req-1', userId: 'user-1' });
      expect(mockTransport.logs[1].fields).toEqual({ requestId: 'req-1', userId: 'user-1' });

      // @ts-expect-error catchall context must match the catchall schema
      catchallLogger.with({ requestId: 123 });
    });

    it('should track fields added through logger context', () => {
      const schema = createSchema<{ requestId: string; userId: string; attempt?: number }>((value) => ({
        value: value as { requestId: string; userId: string; attempt?: number },
      }));

      const typedLogger = new Logger({
        transports: [mockTransport],
        schema,
      });

      const requestLogger = typedLogger.with({ requestId: 'req-1' });
      requestLogger.info('user action', { userId: 'user-1' });

      // @ts-expect-error userId is still required
      requestLogger.info('user action');
      // @ts-expect-error unknown is not part of the schema input
      typedLogger.with({ unknown: true });

      const userLogger = requestLogger.with({ userId: 'user-1' });
      userLogger.info('user action');
      userLogger.info('user action', { attempt: 1 });

      const configuredLogger = new Logger({
        transports: [mockTransport],
        schema,
        args: { requestId: 'req-1' },
      });
      configuredLogger.info('user action', { userId: 'user-1' });

      // @ts-expect-error userId is not provided by the configured context
      configuredLogger.info('user action');
    });

    it('should keep schema-less loggers permissive', () => {
      const untypedLogger = new Logger({ transports: [mockTransport] });

      untypedLogger.info('user action');
      untypedLogger.info('user action', { arbitrary: true });
    });
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

    const rawEvent = {
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
