process.env.ENABLE_AXIOM_LOG_DRAIN = 'true';
process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT = 'https://example.com/api/test';

import { jest, afterEach, it, describe, expect } from '@jest/globals';
import { createLogger } from '../../../src/createLogger';
import { LogDrainTransport } from '../../../src/transports/log-drain.transport';

const mockedLog = jest.spyOn(global.console, 'log');

describe('LogDrain Transport Tests', () => {
  afterEach(() => {
    mockedLog.mockClear();
  });
  it('LogDrainTransport should print JSON log to console immediately', () => {
    const transport = new LogDrainTransport();
    const event = { _time: Date.now().toString(), level: 'info', message: 'hello, world!', fields: {} };
    transport.log(event);
    expect(mockedLog).toHaveBeenCalledTimes(1);
    expect(mockedLog).toHaveBeenCalledWith(JSON.stringify(event));
  });

  it('LogDrainTransport should be selected when flag is enabled', () => {
    const logger = createLogger();
    logger.info('test_log_drain');
    expect(logger.config.transport instanceof LogDrainTransport).toBe(true);
    expect(mockedLog).toHaveBeenCalledTimes(1);
  });
});
