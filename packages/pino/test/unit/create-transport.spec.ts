import { describe, it, expect } from 'vitest';
import axiomTransport from '../../src';

describe('pino transport tests', () => {
  it('creates a truthy instance', () => {
    const t = axiomTransport({ token: process.env.AXIOM_TOKEN || '', dataset: process.env.AXIOM_DATASET || ''});
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });
});
