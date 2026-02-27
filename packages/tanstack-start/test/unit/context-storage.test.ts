import { AsyncLocalStorage } from 'node:async_hooks';
import { EVENT } from '@axiomhq/logging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const baseEvent = {
  level: 'info',
  message: 'msg',
  fields: { existing: true },
  _time: new Date().toISOString(),
  '@app': {
    'axiom-logging-version': '0.0.0',
  },
  source: 'server-log',
};

describe('context storage', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('merges map context fields and EVENT metadata into the log event', async () => {
    vi.stubGlobal('AsyncLocalStorage', AsyncLocalStorage);

    const { runWithServerContext, startServerContextFieldsFormatter } = await import('../../src/context/storage');

    const store = new Map<string | typeof EVENT, unknown>();
    store.set('userId', 'user-1');
    store.set(EVENT, { requestId: 'req-1', traceId: 'trace-1' });

    const formatted = runWithServerContext(() => startServerContextFieldsFormatter(baseEvent), store) as Record<string, any>;

    expect(formatted.fields.userId).toBe('user-1');
    expect(formatted.requestId).toBe('req-1');
    expect(formatted.traceId).toBe('trace-1');
  });

  it('merges object context fields and EVENT metadata into the log event', async () => {
    vi.stubGlobal('AsyncLocalStorage', AsyncLocalStorage);

    const { runWithServerContext, startServerContextFieldsFormatter } = await import('../../src/context/storage');

    const store = {
      environment: 'staging',
      [EVENT]: { source: 'tanstack-start-request' },
    };

    const formatted = runWithServerContext(() => startServerContextFieldsFormatter(baseEvent), store) as Record<string, any>;

    expect(formatted.fields.environment).toBe('staging');
    expect(formatted.source).toBe('tanstack-start-request');
  });

  it('falls back gracefully when AsyncLocalStorage is unavailable', async () => {
    vi.stubGlobal('AsyncLocalStorage', undefined);

    const { getServerContextStore, runWithServerContext, startServerContextFieldsFormatter } = await import(
      '../../src/context/storage'
    );

    const result = runWithServerContext(() => 'ok', new Map());
    const formatted = startServerContextFieldsFormatter(baseEvent);

    expect(result).toBe('ok');
    expect(getServerContextStore()).toBeUndefined();
    expect(formatted).toBe(baseEvent);
  });
});
