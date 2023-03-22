// clear axiom env vars before importing logger
process.env.AXIOM_TOKEN = '';
process.env.AXIOM_INGEST_ENDPOINT = '';
process.env.AXIOM_LOG_LEVEL = 'error';

import { jest, it, expect } from '@jest/globals';
import { createLogger } from '../../../src/createLogger';
import { LogLevel } from '../../../src/logging/levels';
import { ConsoleTransport } from '../../../src/transports/console.transport';

it('log levels', async () => {
  const mockedLog = jest.spyOn(ConsoleTransport.prototype, 'log'); // .mockImplementation(async (event: LogEvent): Promise<void> => {});
  let logger = createLogger();
  expect(logger.config.adapter.isEnvVarsSet()).toBe(false);
  expect(logger.logLevel).toEqual(LogLevel.error);

  logger.info('test');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(0);

  // test overriding log level per logger
  logger = createLogger();
  logger.logLevel = LogLevel.error;
  logger.debug('hello');
  logger.info('hello');
  logger.warn('hello');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(0);

  logger = createLogger();
  logger.logLevel = LogLevel.warn;
  logger.info('hello');
  logger.debug('hello');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(0);

  logger = createLogger();
  logger.logLevel = LogLevel.info;
  logger.debug('hello');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(0);

  // disabled logging
  logger = createLogger();
  logger.logLevel = LogLevel.off;
  logger.error('no logs');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(0);

  logger = createLogger();
  logger.logLevel = LogLevel.error;
  logger.warn('warn');
  logger.error('error');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(1);

  logger = createLogger();
  logger.logLevel = LogLevel.debug;
  logger.warn('hello');
  await logger.flush();
  expect(mockedLog).toHaveBeenCalledTimes(2);
});
