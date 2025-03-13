import { Formatter } from '@axiomhq/logging';
import { AsyncLocalStorage } from '../lib/node-utils';

export type ServerContextFields = Map<string, any> | Record<string, any>;
export const storage = new AsyncLocalStorage<ServerContextFields | undefined>();

/**
 * Adds custom fields like trace_id to the fields object in a logger
 * if they are present in the context
 * @param fields - The fields to merge
 * @returns The merged fields
 */
export const serverContextFieldsFormatter: Formatter = (logEvent) => {
  const store = storage.getStore();
  if (!store) {
    return logEvent;
  }

  if (store instanceof Map) {
    return {
      ...logEvent,
      fields: {
        ...logEvent.fields,
        ...Object.fromEntries(store.entries()),
      },
    };
  }

  return {
    ...logEvent,
    fields: {
      ...logEvent.fields,
      ...store,
    },
  };
};

export const runWithServerContext = (callback: () => any, store: ReturnType<typeof storage.getStore>) => {
  return storage.run(store, callback);
};
