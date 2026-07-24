import { describe, expect, it } from 'vitest';

import { safeStringify } from '../../../src/internal/safe-stringify';

describe('safeStringify', () => {
  it('replaces circular references without changing shared references', () => {
    const shared = { value: 1 };
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(JSON.parse(safeStringify({ first: shared, second: shared, circular }))).toEqual({
      first: shared,
      second: shared,
      circular: { self: '[Circular]' },
    });
  });

  it('serializes bigint values as strings', () => {
    expect(JSON.parse(safeStringify({ value: 42n }))).toEqual({ value: '42' });
  });
});
