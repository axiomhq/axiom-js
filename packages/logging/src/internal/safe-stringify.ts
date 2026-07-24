const CIRCULAR = '[Circular]';
const UNSERIALIZABLE = '[Unserializable]';

function replaceCircularReferences() {
  const ancestors: object[] = [];

  return function (this: object, _key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return CIRCULAR;
    }

    ancestors.push(value);
    return value;
  };
}

/**
 * JSON.stringify with circular-reference and bigint handling.
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, replaceCircularReferences()) ?? 'null';
  } catch {
    return JSON.stringify(UNSERIALIZABLE);
  }
}
