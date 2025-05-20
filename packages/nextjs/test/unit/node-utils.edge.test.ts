// @vitest-environment edge-runtime

import { describe, it, expect } from 'vitest';
import { crypto, AsyncLocalStorage } from '../../src/lib/node-utils';

describe('node-utils', () => {
  it('should be defined', () => {
    expect(crypto).toBeDefined();
    expect(AsyncLocalStorage).toBeDefined();
  });

  it('should be the same as the global crypto', () => {
    expect(crypto).toBe(globalThis.crypto);
  });

  it('should generate random UUIDs', () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toBeDefined();
    expect(uuid.length).toBe(36);
  });

  it('should create a new AsyncLocalStorage instance', () => {
    const asyncLocalStorage = new AsyncLocalStorage();
    expect(asyncLocalStorage).toBeDefined();
  });
});
