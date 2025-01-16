import { Logger } from '@axiomhq/logger';
import { createUseLogger } from './use-logger';

export const createClientSideHelpers = (logger: Logger) => {
  return {
    useLogger: createUseLogger(logger),
  };
};
