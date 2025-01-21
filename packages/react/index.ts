import { Logger } from '@axiomhq/logging';
import { createUseLogger } from './use-logger';

export const createClientSideHelpers = (logger: Logger) => {
  return {
    useLogger: createUseLogger(logger),
  };
};
