import { Logger } from '@axiomhq/logging';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isHTTPAccessFallbackError } from 'next/dist/client/components/http-access-fallback/http-access-fallback';
import * as next from 'next/server';

const after = next.after;

export type NextHandler<T = any> = (
  req: next.NextRequest,
  arg?: T,
) => Promise<Response> | Promise<next.NextResponse> | next.NextResponse | Response;

export const transformSuccessResult = (data: SuccessData): [message: string, report: Record<string, any>] => {
  const report = {
    request: {
      type: 'request',
      method: data.req.method,
      url: data.req.url,
      statusCode: data.res.status,
      durationMs: data.end - data.start,
      path: new URL(data.req.url).pathname,
      endTime: data.end,
      startTime: data.start,
    },
  };

  return [
    `${data.req.method} ${report.request.path} ${report.request.statusCode} in ${report.request.endTime - report.request.startTime}ms`,
    report,
  ];
};

export const transformErrorResult = (data: ErrorData): [message: string, report: Record<string, any>] => {
  const statusCode = data.error instanceof Error ? getNextErrorStatusCode(data.error) : 500;

  const report = {
    type: 'request',
    method: data.req.method,
    url: data.req.url,
    statusCode: statusCode,
    durationMs: data.end - data.start,
    path: new URL(data.req.url).pathname,
    endTime: data.end,
    startTime: data.start,
  };

  return [`${data.req.method} ${report.path} ${report.statusCode} in ${report.endTime - report.startTime}ms`, report];
};

export interface BaseData {
  req: next.NextRequest;
  start: number;
  end: number;
}
export interface SuccessData extends BaseData {
  res: next.NextResponse | Response;
}

export interface ErrorData extends BaseData {
  error: Error | unknown;
}

export type AxiomHandlerCallbackParams =
  | {
      ok: true;
      data: SuccessData;
    }
  | { ok: false; data: ErrorData };

export type axiomHandlerCallback = (result: AxiomHandlerCallbackParams) => void | Promise<void>;

export const getNextErrorStatusCode = (error: Error & { digest?: string }) => {
  if (!error.digest) {
    return 500;
  }

  if (isRedirectError(error)) {
    return error.digest.split(';')[3];
  } else if (isHTTPAccessFallbackError(error)) {
    return error.digest.split(';')[1];
  }
};

export const logErrorByStatusCode = (statusCode: number) => {
  switch (statusCode) {
    case 404:
    case 403:
    case 401:
      return 'warn';
    case 307:
    case 308:
      return 'info';
    default:
      return 'error';
  }
};

export const createDefaultAxiomHandlerCallback = (logger: Logger): axiomHandlerCallback => {
  return async (result) => {
    if (result.ok) {
      logger.info(...transformSuccessResult(result.data));
    } else {
      if (result.data.error instanceof Error) {
        logger.error(result.data.error.message, result.data.error);
        const [message, report] = transformErrorResult(result.data);
        logger[logErrorByStatusCode(report.statusCode)](message, report);
      }
    }
  };
};

export const createAxiomRouteHandler = (logger: Logger) => {
  const withAxiom = (
    handler: NextHandler,
    callback: axiomHandlerCallback = createDefaultAxiomHandlerCallback(logger),
  ) => {
    return async (req: next.NextRequest, ctx: any) => {
      const start = Date.now();
      try {
        const response = await handler(req, ctx);
        const end = Date.now();
        const httpData = { req, res: response, start, end };

        const callbackFn = async () => callback({ ok: true, data: httpData });
        // TODO: this surely can be written better
        if (typeof after !== 'undefined') {
          after(callbackFn());
        } else {
          await callbackFn();
        }

        return response;
      } catch (error) {
        const end = Date.now();
        const callbackFn = async () => {
          callback({ ok: false, data: { req, error, start, end } });
        };
        if (typeof after !== 'undefined') {
          after(callbackFn());
        } else {
          await callbackFn();
        }
        throw error;
      }
    };
  };

  return withAxiom;
};
