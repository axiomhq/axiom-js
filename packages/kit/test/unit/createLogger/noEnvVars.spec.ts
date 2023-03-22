// clear Axiom env vars
process.env.AXIOM_URL = '';
process.env.AXIOM_DATASET = '';
process.env.AXIOM_TOKEN = '';
process.env.AXIOM_INGEST_ENDPOINT = '';
process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT = '';
import { jest, it, describe, afterEach, expect } from '@jest/globals';
import { GenericAdapter } from '../../../src/adapters/generic-adapter';
import { createLogger } from '../../../src/createLogger';
import { ConsoleTransport } from '../../../src/transports/console.transport';

const mockedFetch = jest.spyOn(global, 'fetch');
const mockedLog = jest.spyOn(global.console, 'log');

describe('No Env Vars', () => {
  jest.useFakeTimers();

  afterEach(() => {
    mockedLog.mockClear();
    mockedFetch.mockClear();
  });

  it('sending logs on localhost should fallback to console', () => {
    const log = createLogger();
    expect(log.config.adapter).toBeInstanceOf(GenericAdapter);
    expect(log.config.transport).toBeInstanceOf(ConsoleTransport);
    log.info('hello, world!');
    jest.advanceTimersByTime(1000);
    expect(mockedLog).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(0);
  });
});
