import { describe, it, expect } from 'vitest';
import { AxiomStream } from '../../src';

describe('Bunyan stream tests', () => {
    it('creates a truthy instance', () => {
        const t = new AxiomStream({orgId: 'test', token: 'test', dataset: 'test' });
        expect(t).toBeTruthy()
        expect(t).toBeDefined()
    })
})