import { describe, expect, it } from 'vitest';
import { Axiom } from '../../src/client';
import { Logger } from '../../src/logger'

describe('Axiom', () => {
    const client = new Axiom({ token: ''})
    expect(client).toBeDefined()

    it('Should create an instance of logger', () => {
        const logger = new Logger({ autoFlush: true, dataset: '', client })
        expect(logger).toBeDefined()
    })
})