import { describe, it, expect, vi } from 'vitest';
import { getDefaultLogger, Logger, LogLevel } from '../../src/index';
import { ConsoleTransport } from '../../src/transports/console';

vi.hoisted(() => {
  // stub axiom env vars before importing logger
  vi.stubEnv('NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT', 'https://example.co/api/test');
  vi.stubEnv('NEXT_PUBLIC_AXIOM_LOG_LEVEL', 'error');
});

vi.useFakeTimers();


describe('Testing log levels', () => {
  it('detects environment variable log level', async () => {
    const mockedConsole = vi.spyOn(console, 'log');
    const log = getDefaultLogger();

    log.config.logLevel = LogLevel.error;

    log.info('test');
    await log.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
  })

  it('log levels', async () => {
    const mockedConsole = vi.spyOn(console, 'log');
  
    // test overriding log level per logger
    let logger = new Logger({ args: {}, autoFlush: false, logLevel: LogLevel.error, transport: new ConsoleTransport(), transformers: [] });
    logger.debug('hello');
    logger.info('hello');
    logger.warn('hello');
    await logger.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
  
    logger = new Logger({ args: {}, autoFlush: false, logLevel: LogLevel.warn, transport: new ConsoleTransport(), transformers: [] });
    logger.info('hello');
    logger.debug('hello');
    await logger.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
  
    logger = new Logger({ args: {}, autoFlush: false, logLevel: LogLevel.info, transport: new ConsoleTransport(), transformers: [] });
    logger.debug('hello');
    await logger.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
  
    // disabled logging
    logger = new Logger({ args: {}, autoFlush: false, logLevel: LogLevel.off, transport: new ConsoleTransport(), transformers: [] });
    logger.error('no logs');
    await logger.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
  
    logger = new Logger({ args: {}, autoFlush: false, logLevel: LogLevel.error, transport: new ConsoleTransport(), transformers: [] });
    logger.warn('warn');
    logger.error('error');
    await logger.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(1);
  
    logger = new Logger({ args: {}, autoFlush: false, logLevel: LogLevel.debug, transport: new ConsoleTransport(), transformers: [] });
    logger.warn('hello');
    await logger.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(2);
  });
})
