import { Formatter } from '@axiomhq/logging';
import { AsyncLocalStorage } from '../lib/node-utils';
import { EVENT } from '@axiomhq/logging';

export type ServerContextFields = Map<string | typeof EVENT, any> | Record<string | typeof EVENT, any>;
export const storage = new AsyncLocalStorage<ServerContextFields | undefined>();

/**
 * Formatter that adds context fields from the server context to log events.
 *
 * Regular fields are added to the `fields` property of the log event.
 * Properties under the EVENT symbol are added directly to the root of the log event.
 *
 * @example
 * // Using a Map
 * const contextMap = new Map();
 * contextMap.set('userId', 123);
 * contextMap.set(EVENT, { traceId: 'abc123' });
 * runWithServerContext(() => {
 *   logger.info('Request processed');
 *   // Results in a log with fields.userId=123 and traceId at the root
 * }, contextMap);
 *
 * @example
 * // Using an object
 * const contextObj = {
 *   userId: 123,
 *   [EVENT]: { traceId: 'abc123' }
 * };
 * runWithServerContext(() => {
 *   logger.info('Request processed');
 *   // Results in a log with fields.userId=123 and traceId at the root
 * }, contextObj);
 *
 * @param logEvent - The log event to format
 * @returns The formatted log event with server context fields added
 */
export const serverContextFieldsFormatter: Formatter = (logEvent) => {
  const store = storage.getStore();
  if (!store) {
    return logEvent;
  }

  if (store instanceof Map) {
    // Extract EVENT properties and regular fields separately
    const eventProps = store.get(EVENT);
    const regularFields = Object.fromEntries(Array.from(store.entries()).filter(([key]) => key !== EVENT));

    // Apply EVENT properties directly to the root of the log event
    const result = {
      ...logEvent,
      fields: {
        ...logEvent.fields,
        ...regularFields,
      },
    };

    // Apply EVENT properties to the root if present
    if (eventProps && typeof eventProps === 'object') {
      Object.assign(result, eventProps);
    }

    return result;
  }

  // For regular objects, extract EVENT properties and regular fields separately
  const { [EVENT]: eventProps, ...regularFields } = store;

  // Apply regular fields to the fields property
  const result = {
    ...logEvent,
    fields: {
      ...logEvent.fields,
      ...regularFields,
    },
  };

  // Apply EVENT properties to the root if present
  if (eventProps && typeof eventProps === 'object') {
    Object.assign(result, eventProps);
  }

  return result;
};

/**
 * Runs a callback with the provided server context.
 * The context will be available to all loggers within the callback.
 *
 * @example
 * // Add regular fields and root-level properties to all logs in a request
 * import { EVENT } from '@axiomhq/logging';
 *
 * runWithServerContext(() => {
 *   // All logs within this callback will have userId in fields and traceId at the root
 *   logger.info('Request started');
 *   processRequest();
 *   logger.info('Request completed');
 * }, {
 *   userId: 123,
 *   requestPath: '/api/users',
 *   [EVENT]: {
 *     traceId: 'abc123',
 *     requestId: 'req-456'
 *   }
 * });
 *
 * @param callback - The function to run with the server context
 * @param store - The context to use, can be a Map or an object with optional EVENT symbol
 * @returns The result of the callback
 */
export const runWithServerContext = (callback: () => any, store: ReturnType<typeof storage.getStore>) => {
  return storage.run(store, callback);
};
