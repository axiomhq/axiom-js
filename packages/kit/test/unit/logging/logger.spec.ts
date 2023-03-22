// clear axiom env vars before importing logger
process.env.AXIOM_TOKEN = '';
process.env.AXIOM_INGEST_ENDPOINT = '';
import { jest, it, expect, describe, beforeEach, afterEach } from '@jest/globals';
import { createLogger } from '../../../src/createLogger';
import { LogEvent, Logger } from '../../../src/logging/logger';
import { ConsoleTransport } from '../../../src/transports/console.transport';

describe('Logger tests', () => {
  let log: Logger;
  const mock = jest.spyOn(ConsoleTransport.prototype, 'log');

  beforeEach(() => {
    log = createLogger();
  });

  afterEach(() => {
    mock.mockClear();
  });

  const getMockCallDetails = (mockedLog: jest.SpiedFunction<(event: LogEvent) => Promise<void>>, callIndex = 0) => {
    const payload = mockedLog.mock.calls[callIndex];
    const { level, message, fields } = payload[0];
    return { level, message, fields };
  };

  it('with() should create a child logger', async () => {
    const logger = log.with({ foo: 'bar' });
    logger.info('hello, world!', { bar: 'baz' });
    expect(mock).toHaveBeenCalledTimes(1);

    const { level, message, fields } = getMockCallDetails(mock);
    expect(level).toEqual('info');
    expect(message).toEqual('hello, world!');
    expect(Object.keys(fields).length).toBe(2);
    expect(fields['foo']).toBe('bar');
    expect(fields['bar']).toBe('baz');
  });

  it('passing non-object should be wrapped in object', async () => {
    const logger = log.with({ foo: 'bar' });
    const args = 'baz';
    logger.info('hello, world!', args as unknown as object);
    expect(mock).toHaveBeenCalledTimes(1);

    const { level, message, fields } = getMockCallDetails(mock);
    expect(level).toBe('info');
    expect(message).toBe('hello, world!');
    expect(fields.foo).toBe('bar');
    expect(fields.args).toBe('baz');
  });

  it('flushing parent logger should flush children', async () => {
    log.info('hello, world!');

    const logger1 = log.with({ foo: 'bar' });
    logger1.debug('logger1');

    const logger2 = logger1.with({ bar: 'foo' });
    logger2.flush = jest.fn(() => Promise.resolve());
    logger2.debug('logger2');

    expect(mock).toHaveBeenCalledTimes(3);
    await log.flush();

    expect(logger2.flush).toHaveBeenCalledTimes(1);

    const { fields } = getMockCallDetails(mock, 2);
    expect(fields).toBeTruthy();
    expect(Object.keys(fields).length).toEqual(2);
    expect(fields.foo).toEqual('bar');
    expect(fields.bar).toEqual('foo');
    // ensure there is nothing was left un-flushed
    await log.flush();
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it('throwing exception should be handled as error object', async () => {
    const err = new Error('test');
    log.error('hello, world!', err);
    expect(mock).toHaveBeenCalledTimes(1);
    const { fields } = getMockCallDetails(mock);
    expect(Object.keys(fields).length).toEqual(3); // { name, message, stack }
    expect(fields.message).toEqual(err.message);
    expect(fields.name).toEqual(err.name);
  });
});
