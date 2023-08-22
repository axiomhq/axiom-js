import { describe, it, expect } from 'vitest';
import axiomTransport from '../../src';

describe('pino transport tests', () => {
  it('creates a truthy instance', () => {
    const t = axiomTransport();
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });
});
