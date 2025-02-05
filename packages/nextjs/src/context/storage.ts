import { AsyncLocalStorage } from '../lib/node-utils';

export type ServerContextFields = Map<string, any> | Record<string, any>;
export const storage = new AsyncLocalStorage<ServerContextFields | undefined>();

/**
 * Adds custom fields like trace_id to the fields object in a logger
 * if they are present in the context
 * @param fields - The fields to merge
 * @returns The merged fields
 */
export const serverContextFieldsFormatter = (fields: Record<string, any>) => {
  const store = storage.getStore();
  if (!store) {
    return fields;
  }

  if (store instanceof Map) {
    return { ...fields, ...Object.fromEntries(store.entries()) };
  }

  return { ...fields, ...store };
};

export const runWithServerContext = (callback: () => void, store: ReturnType<typeof storage.getStore>) => {
  return storage.run(store, callback);
};
