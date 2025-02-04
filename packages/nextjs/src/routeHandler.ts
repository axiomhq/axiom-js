import { Logger, LogLevel } from '@axiomhq/logging';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isHTTPAccessFallbackError } from 'next/dist/client/components/http-access-fallback/http-access-fallback';
import * as next from 'next/server';
import { runWithContext } from 'src/context';

const after = next.after;

export type NextHandler<T = any> = (
  req: next.NextRequest,
  arg?: T,
) => Promise<Response> | Promise<next.NextResponse> | next.NextResponse | Response;

const getRegion = (req: next.NextRequest) => {
  let region = '';
  if ('geo' in req) {
    region = (req.geo as { region: string }).region ?? '';
  }
  return region;
};

export const transformRouteHandlerSuccessResult = (
  data: SuccessData,
): [message: string, report: Record<string, any>] => {
  const report = {
    request: {
      startTime: new Date().getTime(),
      endTime: new Date().getTime(),
      path: data.req.nextUrl.pathname ?? new URL(data.req.url).pathname,
      method: data.req.method,
      host: data.req.headers.get('host'),
      userAgent: data.req.headers.get('user-agent'),
      scheme: data.req.url.split('://')[0],
      ip: data.req.headers.get('x-forwarded-for'),
      region: getRegion(data.req),
      statusCode: data.res.status,
    },
  };

  return [
    `${data.req.method} ${report.request.path} ${report.request.statusCode} in ${report.request.endTime - report.request.startTime}ms`,
    report,
  ];
};

export const transformRouteHandlerErrorResult = (data: ErrorData): [message: string, report: Record<string, any>] => {
  const statusCode = data.error instanceof Error ? getNextErrorStatusCode(data.error) : 500;

  const report = {
    request: {
      startTime: new Date().getTime(),
      endTime: new Date().getTime(),
      path: data.req.nextUrl.pathname ?? new URL(data.req.url).pathname,
      method: data.req.method,
      host: data.req.headers.get('host'),
      userAgent: data.req.headers.get('user-agent'),
      scheme: data.req.url.split('://')[0],
      ip: data.req.headers.get('x-forwarded-for'),
      region: getRegion(data.req),
      statusCode: statusCode,
    },
  };

  return [
    `${data.req.method} ${report.request.path} ${report.request.statusCode} in ${report.request.endTime - report.request.startTime}ms`,
    report,
  ];
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

export const getLogLevelFromStatusCode = (statusCode: number): LogLevel => {
  if (statusCode >= 300 && statusCode < 400) {
    return LogLevel.info;
  } else if (statusCode >= 400 && statusCode < 500) {
    return LogLevel.warn;
  }
  return LogLevel.error;
};

export const defaultOnRouteHandlerSuccess = (logger: Logger, data: SuccessData) => {
  logger.info(...transformRouteHandlerSuccessResult(data));
  logger.flush();
};

const defaultRouteHandlerOnError = (logger: Logger, data: ErrorData) => {
  if (data.error instanceof Error) {
    logger.error(data.error.message, data.error);
  }
  const [message, report] = transformRouteHandlerErrorResult(data);
  logger.log(getLogLevelFromStatusCode(report.statusCode), message, report);
  logger.flush();
};

const getStore = async ({
  store,
  req,
  ctx,
}: {
  store?: Map<string, any> | ((req: next.NextRequest, ctx: any) => Map<string, any> | Promise<Map<string, any>>);
  req: next.NextRequest;
  ctx: any;
}) => {
  if (!store) {
    const newStore = new Map();
    newStore.set('trace_id', crypto.randomUUID());
    return newStore;
  }
  if (typeof store === 'function') {
    return await store(req, ctx);
  }
  return store;
};

export const createAxiomRouteHandler = ({
  logger,
  store: argStore,
  onSuccess,
  onError,
}: {
  logger: Logger;
  store?: Map<string, any> | ((req: next.NextRequest, ctx: any) => Map<string, any> | Promise<Map<string, any>>);
  onSuccess?: (data: SuccessData) => void;
  onError?: (data: ErrorData) => void;
}) => {
  const withAxiom = (handler: NextHandler) => {
    return async (req: next.NextRequest, ctx: any) => {
      const store = await getStore({ store: argStore, req, ctx });

      return runWithContext(async () => {
        const start = Date.now();

        try {
          const response = await handler(req, ctx);
          const end = Date.now();
          const httpData = { req, res: response, start, end };

          const callbackFn = async () => {
            if (onSuccess) {
              onSuccess(httpData);
            } else {
              defaultOnRouteHandlerSuccess(logger, httpData);
            }
          };
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
            if (onError) {
              onError({ req, error, start, end });
            } else {
              defaultRouteHandlerOnError(logger, { req, error, start, end });
            }
          };
          if (typeof after !== 'undefined') {
            after(callbackFn());
          } else {
            await callbackFn();
          }
          throw error;
        }
      }, store);
    };
  };

  return withAxiom;
};
