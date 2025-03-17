import { Logger, LogEvent, LogLevel, Formatter, EVENT } from '../../src/logger';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { MockTransport } from '../lib/mock';

describe('Logger', () => {
  let mockTransport: MockTransport;
  let logger: Logger;

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
      expect(mockTransport.logs[0]).toContain({ foo: 'bar' });
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
      expect(mockTransport.logs[0]).toContain({ userId: '123' });
    });

    it('should inject root fields into child loggers', () => {
      const childLogger = logger.with({ userId: '123' });
      childLogger.info('user action', { [EVENT]: { action: 'login' } });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toContain({ action: 'login' });
      expect(mockTransport.logs[0].fields).toEqual({ userId: '123' });
    });

    it('should handle both root and and normal fields', () => {
      logger.info('user action', { [EVENT]: { userId: '123' }, userName: 'John Doe' });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toContain({ userId: '123' });
      expect(mockTransport.logs[0].fields).toEqual({ userName: 'John Doe' });
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
      };

      logger.raw(rawEvent);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0]).toEqual(rawEvent);
    });
  });
});
