import { describe, it, expect } from 'vitest';
import { WinstonTransport } from '../../src';

describe('winston transport tests', () => {
    it('creates a truthy instance', () => {
        const t = new WinstonTransport();
        expect(t).toBeTruthy()
        expect(t).toBeDefined()
    })
})