import type { Formatter } from '@axiomhq/logging';
import { EVENT } from '@axiomhq/logging';

export type ServerContextFields = Map<string | typeof EVENT, unknown> | Record<string | typeof EVENT, unknown>;

type AsyncLocalStorageLike<T> = {
  getStore: () => T | undefined;
  run: <R>(store: T, callback: () => R) => R;
};

type AsyncLocalStorageConstructor = new <T>() => AsyncLocalStorageLike<T>;

const AsyncLocalStorageImpl = (globalThis as { AsyncLocalStorage?: AsyncLocalStorageConstructor }).AsyncLocalStorage;

const asyncLocalStorage: AsyncLocalStorageLike<ServerContextFields | undefined> | undefined = AsyncLocalStorageImpl
  ? new AsyncLocalStorageImpl<ServerContextFields | undefined>()
  : undefined;

export const getServerContextStore = () => {
  return asyncLocalStorage?.getStore();
};

const mergeContextIntoEvent = (
  logEvent: Parameters<Formatter>[0],
  regularFields: Record<string, unknown>,
  eventProps: unknown,
) => {
  const result = {
    ...logEvent,
    fields: {
      ...logEvent.fields,
      ...regularFields,
    },
  };

  if (eventProps && typeof eventProps === 'object') {
    Object.assign(result, eventProps);
  }

  return result;
};

export const startServerContextFieldsFormatter: Formatter = (logEvent) => {
  const store = getServerContextStore();

  if (!store) {
    return logEvent;
  }

  if (store instanceof Map) {
    const eventProps = store.get(EVENT);
    const regularFields = Object.fromEntries(
      Array.from(store.entries())
        .filter(([key]) => key !== EVENT)
        .map(([key, value]) => [String(key), value]),
    );

    return mergeContextIntoEvent(logEvent, regularFields, eventProps);
  }

  const { [EVENT]: eventProps, ...regularFields } = store;
  return mergeContextIntoEvent(logEvent, regularFields, eventProps);
};

export const runWithServerContext = <T>(callback: () => T, store: ServerContextFields | undefined): T => {
  if (!asyncLocalStorage) {
    return callback();
  }

  return asyncLocalStorage.run(store, callback);
};
