import { describe, it, expect } from 'vitest';
import { safeStringify } from '../../../src/internal/safe-stringify';

describe('safeStringify', () => {
  it('round-trips a circular object without throwing', () => {
    const a: any = { name: 'a' };
    a.self = a;
    const out = safeStringify(a);
    const parsed = JSON.parse(out);
    expect(parsed.name).toBe('a');
    expect(parsed.self).toBe('[Circular]');
  });

  it('replaces functions with [Function]', () => {
    const out = safeStringify({ fn: () => 1, nested: { cb: function named() {} } });
    expect(JSON.parse(out)).toEqual({ fn: '[Function]', nested: { cb: '[Function]' } });
  });

  it('serializes Error including cause chain', () => {
    const root = new Error('root');
    const wrap = new Error('wrap', { cause: root });
    const parsed = JSON.parse(safeStringify({ err: wrap }));
    expect(parsed.err.name).toBe('Error');
    expect(parsed.err.message).toBe('wrap');
    expect(parsed.err.cause.message).toBe('root');
    expect(typeof parsed.err.stack).toBe('string');
  });

  it('replaces DOM-like objects with an [Element TAG] token', () => {
    const prevWindow = (globalThis as any).window;
    const prevElement = (globalThis as any).Element;
    class FakeElement {
      tagName = 'IMG';
    }
    (globalThis as any).window = {};
    (globalThis as any).Element = FakeElement;

    try {
      const el = new FakeElement();
      const circular: any = { el };
      (el as any).__reactFiber = { stateNode: el };
      const parsed = JSON.parse(safeStringify({ payload: el, circular }));
      expect(parsed.payload).toBe('[Element IMG]');
      expect(parsed.circular.el).toBe('[Element IMG]');
    } finally {
      (globalThis as any).window = prevWindow;
      (globalThis as any).Element = prevElement;
    }
  });

  it('leaves plain objects, arrays and primitives intact', () => {
    const input = { a: 1, b: 'x', c: [1, 2, { d: true }], e: null };
    expect(JSON.parse(safeStringify(input))).toEqual(input);
  });

  it('handles the realistic React-fiber-on-Element shape', () => {
    const prevWindow = (globalThis as any).window;
    const prevElement = (globalThis as any).Element;
    class FakeElement {
      tagName = 'IMG';
    }
    (globalThis as any).window = {};
    (globalThis as any).Element = FakeElement;

    try {
      const img: any = new FakeElement();
      img.__reactFiber$abc = { stateNode: img };
      const metric = {
        name: 'LCP',
        value: 1234,
        entries: [{ element: img }],
      };
      const parsed = JSON.parse(safeStringify({ webVital: metric }));
      expect(parsed.webVital.name).toBe('LCP');
      expect(parsed.webVital.entries[0].element).toBe('[Element IMG]');
    } finally {
      (globalThis as any).window = prevWindow;
      (globalThis as any).Element = prevElement;
    }
  });

  it('serializes Date, RegExp, and bigint to stable primitives', () => {
    const parsed = JSON.parse(
      safeStringify({
        when: new Date('2026-04-14T00:00:00.000Z'),
        pattern: /abc/gi,
        big: 42n,
      }),
    );
    expect(parsed.when).toBe('2026-04-14T00:00:00.000Z');
    expect(parsed.pattern).toBe('/abc/gi');
    expect(parsed.big).toBe('42');
  });

  it('is SSR-safe: does not throw and does not tag anything as DOM when window is undefined', () => {
    const prevWindow = (globalThis as any).window;
    delete (globalThis as any).window;
    try {
      const circular: any = { a: 1 };
      circular.self = circular;
      const lookalike = { tagName: 'IMG', nodeType: 1 };
      const parsed = JSON.parse(safeStringify({ circular, lookalike }));
      expect(parsed.circular.self).toBe('[Circular]');
      // Without window, the DOM check is skipped — lookalike stays a plain object.
      expect(parsed.lookalike).toEqual({ tagName: 'IMG', nodeType: 1 });
    } finally {
      if (prevWindow === undefined) {
        delete (globalThis as any).window;
      } else {
        (globalThis as any).window = prevWindow;
      }
    }
  });

  it('falls back to a stub when a property getter throws', () => {
    const bad = {
      get boom(): never {
        throw new Error('nope');
      },
      ok: 1,
    };
    // Should not throw; should contain the [Unserializable] stub for the bad key.
    const parsed = JSON.parse(safeStringify(bad));
    expect(parsed.ok).toBe(1);
    expect(parsed.boom).toBe('[Unserializable]');
  });
});
