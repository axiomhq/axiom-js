import { vi } from 'vitest';
import { AsyncLocalStorage } from 'node:async_hooks';

const hoistedMockAfter = vi.hoisted(() => {
  const mockAfter = vi.fn().mockImplementation((task: (() => any) | Promise<any>) => {
    if (task instanceof Promise) {
      return task;
    }
    if (typeof task === 'function') {
      const result = task();
      return result instanceof Promise ? result : Promise.resolve(result);
    }
    return Promise.resolve(task);
  });
  return {
    after: mockAfter,
  };
});

vi.mock('next/server', async () => {
  const actual = (await vi.importActual('next/server')) as Record<string, unknown>;
  return {
    ...(actual as Record<string, unknown>),
    after: hoistedMockAfter.after,
  };
});

// Adds crypto to globalThis if using Node.js v18
if (process.version.startsWith('v18')) {
  vi.stubGlobal('crypto', require('node:crypto'));
}

vi.stubGlobal('AsyncLocalStorage', AsyncLocalStorage);
