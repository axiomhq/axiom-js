import { describe, beforeEach, afterEach, it, expect, vi, SpyInstance } from 'vitest';
import { ConsoleTransport } from '../../../src/transports/console';
import * as shared from '../../../src/runtime';
import { createLogEvent } from '../../lib/mock';
import { LogLevel } from 'src/logger';

describe('ConsoleTransport', () => {
  let consoleSpy: SpyInstance;
  let transport: ConsoleTransport;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('basic logging', () => {
    beforeEach(() => {
      transport = new ConsoleTransport({ prettyPrint: false });
    });

    it('should log message with level', () => {
      const event = createLogEvent('info', 'test message');
      transport.log([event]);

      expect(consoleSpy).toHaveBeenCalledWith('info - test message');
    });

    it('should include fields in log output', () => {
      const event = createLogEvent('info', 'test message', { userId: '123' });
      transport.log([event]);

      expect(consoleSpy).toHaveBeenCalledWith('info - test message {"userId":"123"}');
    });

    it('should handle multiple log events', () => {
      const events = [createLogEvent('info', 'first message'), createLogEvent('error', 'second message')];
      transport.log(events);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'info - first message');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'error - second message');
    });
  });

  describe('pretty print', () => {
    beforeEach(() => {
      transport = new ConsoleTransport({ prettyPrint: true });
    });

    describe('browser formatting', () => {
      beforeEach(() => {
        vi.spyOn(shared, 'isBrowser', 'get').mockReturnValue(true);
      });

      it('should format info level with correct color', () => {
        transport.log([createLogEvent('info', 'test message')]);

        expect(consoleSpy).toHaveBeenCalledWith('%c%s - %s', 'color: lightgreen;', 'info', 'test message');
      });

      it('should format error level with correct color', () => {
        transport.log([createLogEvent('error', 'test message')]);

        expect(consoleSpy).toHaveBeenCalledWith('%c%s - %s', 'color: red;', 'error', 'test message');
      });

      it('should include fields as object in browser', () => {
        const fields = { userId: '123', action: 'login' };
        transport.log([createLogEvent('info', 'test message', fields)]);

        expect(consoleSpy).toHaveBeenCalledWith('%c%s - %s %o', 'color: lightgreen;', 'info', 'test message', fields);
      });
    });

    describe('terminal formatting', () => {
      beforeEach(() => {
        vi.spyOn(shared, 'isBrowser', 'get').mockReturnValue(false);
      });

      it('should format info level with correct color code', () => {
        transport.log([createLogEvent('info', 'test message')]);

        expect(consoleSpy).toHaveBeenCalledWith('\x1b[32m%s\x1b[0m - %s', 'info', 'test message');
      });

      it('should format error level with correct color code', () => {
        transport.log([createLogEvent('error', 'test message')]);

        expect(consoleSpy).toHaveBeenCalledWith('\x1b[31m%s\x1b[0m - %s', 'error', 'test message');
      });

      it('should include fields as object in terminal', () => {
        const fields = { userId: '123', action: 'login' };
        transport.log([createLogEvent('info', 'test message', fields)]);

        expect(consoleSpy).toHaveBeenCalledWith('\x1b[32m%s\x1b[0m - %s %o', 'info', 'test message', fields);
      });
    });

    it('should handle all log levels with correct colors', () => {
      transport = new ConsoleTransport({ logLevel: LogLevel.debug });
      const levels = ['debug', 'info', 'warn', 'error'];
      levels.forEach((level) => {
        consoleSpy.mockClear();
        transport.log([createLogEvent(level, 'test message')]);
        expect(consoleSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('flush', () => {
    it('should resolve immediately', async () => {
      transport = new ConsoleTransport();
      expect(transport.flush()).toBeUndefined();
    });
  });

  describe('log level filtering', () => {
    it('should filter logs based on logLevel', () => {
      transport = new ConsoleTransport({
        prettyPrint: false,
        logLevel: LogLevel.warn,
      });

      transport.log([
        createLogEvent('debug', 'debug message'),
        createLogEvent('info', 'info message'),
        createLogEvent('warn', 'warn message'),
        createLogEvent('error', 'error message'),
      ]);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('warn - warn message');
      expect(consoleSpy).toHaveBeenCalledWith('error - error message');
    });

    it('should use info as default logLevel', () => {
      transport = new ConsoleTransport({ prettyPrint: false });

      transport.log([
        createLogEvent('debug', 'debug message'),
        createLogEvent('info', 'info message'),
        createLogEvent('warn', 'warn message'),
      ]);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).not.toHaveBeenCalledWith('debug - debug message');
      expect(consoleSpy).toHaveBeenCalledWith('info - info message');
      expect(consoleSpy).toHaveBeenCalledWith('warn - warn message');
    });
  });
});
