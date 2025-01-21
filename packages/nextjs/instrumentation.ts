import { onRequestError } from '@/instrumentation';
import { Logger } from '@axiomhq/logging';
import { Instrumentation } from 'next';

export const transformOnRequestError = (
  ...args: Parameters<Instrumentation.onRequestError>
): [message: string, report: Record<string, any>] => {
  const [error, request, context] = args;
  if (error instanceof Error) {
    return [
      error.message,
      {
        ...error,
        error: error.name,
        cause: error.cause,
        stack: error.stack,
        digest: (error as Error & { digest?: string }).digest,
        request: request,
        context: context,
      },
    ];
  }
  return [
    `${request.method} ${request.path} ${context.routeType}`,
    {
      error,
      request: request,
      context: context,
    },
  ];
};

export const createOnRequestError =
  (logger: Logger): Instrumentation.onRequestError =>
  async (...args) => {
    logger.error(...transformOnRequestError(...args));
    await logger.flush();
  };
