import { fileURLToPath } from 'node:url';
import pino from 'pino';
import { describe, expect, it } from 'vitest';

describe('pino worker transport', () => {
  it('accepts a custom Axiom onError callback', () => {
    const target = fileURLToPath(new URL('../../src/index.ts', import.meta.url));

    expect(() =>
      pino.transport({
        target,
        options: {
          dataset: 'test-dataset',
          token: 'test-token',
          onError: () => undefined,
        },
      }),
    ).not.toThrow();
  });
});
