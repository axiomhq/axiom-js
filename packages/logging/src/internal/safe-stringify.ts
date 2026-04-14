const UNSERIALIZABLE = '[Unserializable]';

function isDOMNode(value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const Element = (globalThis as any).Element;
    const Node = (globalThis as any).Node;
    if (typeof Element === 'function' && value instanceof Element) return true;
    if (typeof Node === 'function' && value instanceof Node) return true;
  } catch {
    // instanceof against hostile globals — fall through
  }
  return false;
}

function domTag(value: any): string {
  const tag = typeof value?.tagName === 'string' ? value.tagName : '';
  if (tag) return `[Element ${tag}]`;
  const nodeName = typeof value?.nodeName === 'string' ? value.nodeName : '';
  return nodeName ? `[Node ${nodeName}]` : '[Node]';
}

function serializeError(err: Error, seen: WeakSet<object>): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };
  const cause = (err as { cause?: unknown }).cause;
  if (cause !== undefined) {
    out.cause = sanitize(cause, seen);
  }
  return out;
}

function sanitize(value: unknown, seen: WeakSet<object>): unknown {
  try {
    if (value === null || value === undefined) return value;

    const t = typeof value;
    if (t === 'function') return '[Function]';
    if (t === 'bigint') return (value as bigint).toString();
    if (t !== 'object') return value;

    if (value instanceof Error) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
      return serializeError(value, seen);
    }

    if (isDOMNode(value)) return domTag(value);

    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map((v) => sanitize(v, seen));
    }

    // Keep Date / RegExp / typed arrays / etc. representable.
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.toString();

    // Plain-ish object: iterate own enumerable keys.
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      try {
        out[key] = sanitize((value as Record<string, unknown>)[key], seen);
      } catch {
        out[key] = UNSERIALIZABLE;
      }
    }
    return out;
  } catch {
    return UNSERIALIZABLE;
  }
}

/**
 * JSON.stringify that tolerates circular references, DOM nodes, functions,
 * and Errors with `cause` chains. Never throws — falls back to a stub string
 * for any value it cannot safely serialize.
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(sanitize(value, new WeakSet()));
  } catch {
    try {
      return JSON.stringify(UNSERIALIZABLE);
    } catch {
      return '"[Unserializable]"';
    }
  }
}
