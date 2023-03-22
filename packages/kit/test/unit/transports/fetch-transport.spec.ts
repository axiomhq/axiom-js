/**
 * @jest-environment jsdom
 */
// set axiom env vars before importing logger
process.env.AXIOM_INGEST_ENDPOINT = 'https://example.co/api/test';

import { jest, describe, it, expect, afterEach } from '@jest/globals';
import { createLogger } from '../../../src/createLogger';
import { FetchTransport } from '../../../src/transports/fetch.transport';

describe('FetchTransport test', () => {
  // mock fetch response
  const mockedFetch = jest.spyOn(global, 'fetch').mockImplementation(() => {
    return Promise.resolve(new Response('', { status: 204 }));
  });

  jest.useFakeTimers();
  const mockedConsoleLog = jest.spyOn(global.console, 'log').mockImplementation(() => {});

  afterEach(() => {
    mockedFetch.mockClear();
  });

  it('FetchTransport should throttle logs & send using fetch', () => {
    const transport = new FetchTransport();
    transport.log({ _time: Date.now().toString(), level: 'info', message: 'hello, world!', fields: {} });
    expect(mockedConsoleLog).toHaveBeenCalledTimes(0);
    expect(mockedFetch).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(1000);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('sending logs from browser should be throttled', async () => {
    const log = createLogger();
    log.info('hello, world!');
    expect(log.config.transport instanceof FetchTransport).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1000);
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    log.info('hello, world!');
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    await log.flush();
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('flushing parent logger should flush children', async () => {
    const mockedFlush = jest.spyOn(FetchTransport.prototype, 'flush');
    mockedFetch.mockClear();
    // parent logger
    const log = createLogger();
    expect(log.config.transport).toBeInstanceOf(FetchTransport);
    log.info('hello, world!');
    // sub logger 1
    const logger1 = log.with({ foo: 'bar' });
    expect(logger1.config.transport).toBeInstanceOf(FetchTransport);
    logger1.debug('logger1');
    // sub logger 2
    const logger2 = logger1.with({ bar: 'foo' });
    expect(logger2.config.transport).toBeInstanceOf(FetchTransport);
    logger2.debug('logger2');

    expect(mockedFetch).toHaveBeenCalledTimes(0);
    await log.flush();

    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedFlush).toHaveBeenCalledTimes(3);

    const payload = mockedFetch.mock.calls[2][1] as any;
    const firstLog = JSON.parse(payload.body)[0];
    expect(Object.keys(firstLog.fields)).toHaveLength(2)
    expect(firstLog.fields.foo).toEqual('bar');
    expect(firstLog.fields.bar).toEqual('foo');
    // ensure there is nothing was left un-flushed
    await log.flush();
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });
});
