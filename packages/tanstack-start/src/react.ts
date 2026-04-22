import type { Logger } from '@axiomhq/logging';
import type { ErrorInfo } from 'react';
import { reportClientError, type ClientErrorCaptureConfig } from './client';

const REACT_ERROR_SOURCE = 'tanstack-start-react-error-boundary';

export interface ReactErrorCaptureConfig extends Omit<ClientErrorCaptureConfig, 'source'> {
  source?: string;
}

export interface ReactErrorContext {
  componentStack?: string;
}

export const createAxiomReactErrorHandler = (
  logger: Logger,
  config: ReactErrorCaptureConfig = {},
) => {
  const { source = REACT_ERROR_SOURCE, ...rest } = config;

  return (error: unknown, errorInfo?: Pick<ErrorInfo, 'componentStack'> | ReactErrorContext) => {
    void reportClientError(
      logger,
      {
        error,
        framework: 'react',
        componentStack: errorInfo?.componentStack ?? undefined,
        timestamp: Date.now(),
      },
      {
        ...rest,
        source,
      },
    );
  };
};
