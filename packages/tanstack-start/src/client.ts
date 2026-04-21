import { EVENT, Logger } from '@axiomhq/logging';

type MaybePromise<T> = T | Promise<T>;
type LogReport = Record<string | symbol, unknown>;

type FlushMode = 'sync' | 'async' | 'off';

const DEFAULT_CLIENT_ERROR_SOURCE = 'tanstack-start-client-error';

export interface ClientErrorData {
  error: unknown;
  framework: 'react' | 'solid';
  componentStack?: string;
  timestamp: number;
}

export interface ClientErrorCaptureConfig {
  source?: string;
  flush?: FlushMode;
  onError?: (data: ClientErrorData, report: LogReport) => MaybePromise<void>;
}

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      ...error,
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return error;
};

const flushLogger = async (logger: Logger, mode: FlushMode) => {
  if (mode === 'sync') {
    await logger.flush();
    return;
  }

  if (mode === 'async') {
    void logger.flush();
  }
};

export const transformClientErrorResult = (
  data: ClientErrorData,
  source = DEFAULT_CLIENT_ERROR_SOURCE,
): [message: string, report: LogReport] => {
  const message = data.error instanceof Error ? data.error.message : 'Unhandled client error';

  return [
    `${message} (${data.framework})`,
    {
      error: normalizeError(data.error),
      componentStack: data.componentStack,
      [EVENT]: {
        source,
        client: {
          framework: data.framework,
          timestamp: data.timestamp,
        },
      },
    },
  ];
};

export const reportClientError = async (
  logger: Logger,
  data: ClientErrorData,
  config: ClientErrorCaptureConfig = {},
) => {
  const { onError, source = DEFAULT_CLIENT_ERROR_SOURCE, flush = 'async' } = config;
  const [, report] = transformClientErrorResult(data, source);

  if (onError) {
    await onError(data, report);
  } else {
    const [message] = transformClientErrorResult(data, source);
    logger.error(message, report);
  }

  await flushLogger(logger, flush);
};
