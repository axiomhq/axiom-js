import { describe, it, expect, vi } from 'vitest';
import { getDefaultLogger } from '../../src/index';
import { AxiomTransport } from '../../src/transports/axiom';

vi.hoisted(() => {
    vi.stubEnv('NODE_ENV', 'production');
})

describe('Test Axiom Transport', () => {
    it('ingests to Axiom when env is prod', async () => {
        // TODO: mock Axiom transport and check it has been called 
        const mockedConsole = vi.spyOn(console, 'log');
        const mockedAxiom = vi.spyOn(AxiomTransport.prototype, 'flush');
        const log = getDefaultLogger();

        expect(log.config.transport).toBeInstanceOf(AxiomTransport);
        
        log.info('test');
        expect(mockedAxiom).toHaveBeenCalledTimes(0);
        
        await log.flush();
        expect(mockedConsole).toHaveBeenCalledTimes(0);
        expect(mockedAxiom).toHaveBeenCalledTimes(1);
    })
})

