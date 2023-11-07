import { describe, it, expect } from 'vitest';

import { Logger } from '../../src'

describe('Axiom logger tests', () => {
    it('creates a truthy instance', () => {
        const logger = new Logger({
            dataset: 'xxx',
            token: 'xxxxxx'
        })
        expect(logger).toBeTruthy();
        expect(logger).toBeDefined();
    })
})