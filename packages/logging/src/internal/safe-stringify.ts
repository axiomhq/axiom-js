const CIRCULAR = '[Circular]';
const FUNCTION = '[Function]';
const UNSERIALIZABLE = '[Unserializable]';

type Constructor = new (...args: never[]) => object;

function readStringProperty(value: object, property: string): string | undefined {
  try {
    const result = (value as Record<string, unknown>)[property];
    return typeof result === 'string' ? result : undefined;
  } catch {
    return undefined;
  }
}

function isInstanceOf(value: object, constructor: unknown): boolean {
  if (typeof constructor !== 'function') {
    return false;
  }

  try {
    return value instanceof (constructor as Constructor);
  } catch {
    return false;
  }
}

function serializeDOMNode(value: object): string | undefined {
  if (isInstanceOf(value, (globalThis as { Element?: unknown }).Element)) {
    const tagName = readStringProperty(value, 'tagName');
    return tagName ? `[Element ${tagName}]` : '[Element]';
  }

  if (isInstanceOf(value, (globalThis as { Node?: unknown }).Node)) {
    const nodeName = readStringProperty(value, 'nodeName');
    return nodeName ? `[Node ${nodeName}]` : '[Node]';
  }

  return undefined;
}

function serializeError(error: Error, ancestors: WeakSet<object>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    name: readStringProperty(error, 'name') ?? 'Error',
    message: readStringProperty(error, 'message') ?? '',
  };
  const stack = readStringProperty(error, 'stack');
  if (stack !== undefined) {
    result.stack = stack;
  }

  try {
    const cause = (error as { cause?: unknown }).cause;
    if (cause !== undefined) {
      result.cause = sanitize(cause, ancestors);
    }
  } catch {
    result.cause = UNSERIALIZABLE;
  }

  return result;
}

function sanitize(value: unknown, ancestors: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'function') {
    return FUNCTION;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value !== 'object') {
    return value;
  }

  const domNode = serializeDOMNode(value);
  if (domNode !== undefined) {
    return domNode;
  }

  if (ancestors.has(value)) {
    return CIRCULAR;
  }

  ancestors.add(value);
  try {
    if (value instanceof Error) {
      return serializeError(value, ancestors);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value instanceof RegExp) {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.map((item) => sanitize(item, ancestors));
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      try {
        result[key] = sanitize((value as Record<string, unknown>)[key], ancestors);
      } catch {
        result[key] = UNSERIALIZABLE;
      }
    }
    return result;
  } catch {
    return UNSERIALIZABLE;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Serializes arbitrary log fields without allowing one unsupported value to
 * prevent the rest of the event batch from being delivered.
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(sanitize(value, new WeakSet())) ?? 'null';
  } catch {
    return JSON.stringify(UNSERIALIZABLE);
  }
}
