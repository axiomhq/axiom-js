import { it, expect, vi } from 'vitest';
import { getDefaultLogger } from '../../src/index';
import { ConsoleTransport } from '../../src/transports/console';

it('prints to console when env is test or dev', async () => {
    const mockedConsole = vi.spyOn(console, 'log');
    const log = getDefaultLogger();

    expect(log.config.transport).toBeInstanceOf(ConsoleTransport);

    log.info('test');
    await log.flush();
    expect(mockedConsole).toHaveBeenCalledTimes(1);
})
