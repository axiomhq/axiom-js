import { Logger } from '@axiomhq/logging';
import { createUseLogger } from './use-logger';

export const createClientSideHelpers = (logger: Logger) => {
  if (!logger) {
    throw new Error('A logger must be provided to create client side helpers');
  }

  return {
    useLogger: createUseLogger(logger),
  };
};
