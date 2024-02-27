import { describe, it, expect, vi } from 'vitest';
import { getDefaultLogger, LogLevel } from '../../src/index';

vi.hoisted(() => {
  // stub axiom env vars before importing logger
  vi.stubEnv('AXIOM_INGEST_ENDPOINT', 'https://example.co/api/test');
  vi.stubEnv('AXIOM_LOG_LEVEL', 'error');
});

vi.useFakeTimers();

describe('Testing log levels', () => {
  it('detects environment variable log level', async () => {
    const mockedConsole = vi.spyOn(console, 'log');
    const log = getDefaultLogger();

    expect(log.config.logLevel).toEqual(LogLevel.error);

    log.info('test');
    await log.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
  })
})
