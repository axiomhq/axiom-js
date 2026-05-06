import type { Logger } from '@axiomhq/logging';
import { reportClientError, type ClientErrorCaptureConfig } from './client';

const SOLID_ERROR_SOURCE = 'tanstack-start-solid-error-boundary';

export interface SolidErrorCaptureConfig extends Omit<ClientErrorCaptureConfig, 'source'> {
  source?: string;
}

export const createAxiomSolidErrorHandler = (
  logger: Logger,
  config: SolidErrorCaptureConfig = {},
) => {
  const { source = SOLID_ERROR_SOURCE, ...rest } = config;

  return (error: unknown, _reset?: () => void) => {
    void reportClientError(
      logger,
      {
        error,
        framework: 'solid',
        timestamp: Date.now(),
      },
      {
        ...rest,
        source,
      },
    );
  };
};
