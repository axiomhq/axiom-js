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

  it('serializes values that JSON.stringify cannot represent safely', () => {
    const cause = new Error('root cause');
    const error = new Error('request failed', { cause });

    const result = JSON.parse(
      safeStringify({
        bigint: 42n,
        callback: () => undefined,
        error,
      }),
    );

    expect(result.bigint).toBe('42');
    expect(result.callback).toBe('[Function]');
    expect(result.error).toMatchObject({
      name: 'Error',
      message: 'request failed',
      cause: {
        name: 'Error',
        message: 'root cause',
      },
    });
  });

  it('replaces DOM elements before traversing framework references', () => {
    const previousElement = (globalThis as { Element?: unknown }).Element;
    class FakeElement {
      tagName = 'IMG';
      frameworkReference = { element: this };
    }
    (globalThis as { Element?: unknown }).Element = FakeElement;

    try {
      expect(JSON.parse(safeStringify({ element: new FakeElement() }))).toEqual({
        element: '[Element IMG]',
      });
    } finally {
      (globalThis as { Element?: unknown }).Element = previousElement;
    }
  });

  it('isolates properties whose getters throw', () => {
    const value = {
      ok: true,
      get broken(): never {
        throw new Error('no access');
      },
    };

    expect(JSON.parse(safeStringify(value))).toEqual({
      ok: true,
      broken: '[Unserializable]',
    });
  });
});
