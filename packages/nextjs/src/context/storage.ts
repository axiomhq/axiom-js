import { AsyncLocalStorage } from '../lib/node-utils';

export const storage = new AsyncLocalStorage<Map<string, any> | undefined>();

/**
 * Adds custom fields like trace_id to the fields object in a logger
 * if they are present in the context
 * @param fields - The fields to merge
 * @returns The merged fields
 */
export const serverContextFieldsFormatter = (fields: Record<string, any>) => {
  const store = storage.getStore() as Map<string, any>;
  if (!store) {
    return fields;
  }
  return { ...fields, ...Object.fromEntries(store.entries()) };
};

export const runWithContext = (callback: () => void, store: Map<string, any>) => {
  return storage.run(store, callback);
};
