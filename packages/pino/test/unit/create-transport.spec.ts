import { describe, it, expect } from '@jest/globals';
import axiomTransport from '../../src';

describe('pino transport tests', () => {
  it('creates a truthy instance', () => {
    const t = axiomTransport();
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });
});
