import { it, expect, vi } from 'vitest';
import { getDefaultLogger, LogLevel } from '../../src/index';

vi.hoisted(() => {
    // stub axiom env vars before importing logger
    vi.stubEnv('AXIOM_URL', 'https://example.co/api/test');
    vi.stubEnv('AXIOM_LOG_LEVEL', 'off');
});

vi.useFakeTimers();

it('disables logs when env is off', async () => {
    const mockedConsole = vi.spyOn(console, 'log');
    const log = getDefaultLogger();

    expect(log.config.logLevel).toEqual(LogLevel.off);

    log.info('test');
    await log.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(0);
})
