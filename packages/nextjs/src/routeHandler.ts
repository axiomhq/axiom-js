import { Logger, LogLevel } from '@axiomhq/logging';
import * as next from 'next/server';
import { runWithServerContext, ServerContextFields } from './context';
import { crypto } from './lib/node-utils';
import { getAccessFallbackHTTPStatus, isHTTPAccessFallbackError } from 'src/lib/next-http-errors';
import { getRedirectStatus, isRedirectError } from 'src/lib/next-redirect-errors';
import { NextRequest, NextResponse } from 'next/server';

const after = next.after;

export type NextHandler<T = Request, A = any, R extends Response = Response> = (
  req: T extends Request ? T : Request,
  arg?: A,
) => Promise<R> | Promise<NextResponse> | NextResponse | R;

export const transformRouteHandlerSuccessResult = (
  data: SuccessData,
): [message: string, report: Record<string, any>] => {
  const report = {
    request: {
      startTime: new Date().getTime(),
      endTime: new Date().getTime(),
      path: 'nextUrl' in data.req ? (data.req.nextUrl as URL).pathname : new URL(data.req.url).pathname,
      method: data.req.method,
      host: data.req.headers.get('host'),
      userAgent: data.req.headers.get('user-agent'),
      scheme: data.req.url.split('://')[0],
      ip: data.req.headers.get('x-forwarded-for'),
      region: 'geo' in data.req ? (data.req.geo as { region: string }).region ?? undefined : undefined,
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
      path: 'nextUrl' in data.req ? (data.req.nextUrl as URL).pathname : new URL(data.req.url).pathname,
      method: data.req.method,
      host: data.req.headers.get('host'),
      userAgent: data.req.headers.get('user-agent'),
      scheme: data.req.url.split('://')[0],
      ip: data.req.headers.get('x-forwarded-for'),
      region: 'geo' in data.req ? (data.req.geo as { region: string }).region ?? '' : '',
      statusCode: statusCode,
    },
  };

  return [
    `${data.req.method} ${report.request.path} ${report.request.statusCode} in ${report.request.endTime - report.request.startTime}ms`,
    report,
  ];
};

export interface BaseData<T = Request> {
  req: T extends Request ? T : Request;
  start: number;
  end: number;
}

export interface SuccessData<T = Request, R extends Response = Response> extends BaseData<T> {
  res: R;
}

export interface ErrorData<T = Request> extends BaseData<T> {
  error: Error | unknown;
}

export type AxiomHandlerCallbackParams<T = Request, R extends Response = Response> =
  | {
      ok: true;
      data: SuccessData<T, R>;
    }
  | { ok: false; data: ErrorData<T> };

export type axiomHandlerCallback<T = Request, R extends Response = Response> = (
  result: AxiomHandlerCallbackParams<T, R>,
) => void | Promise<void>;

export const getNextErrorStatusCode = (error: Error & { digest?: string }) => {
  if (isRedirectError(error)) {
    return getRedirectStatus(error);
  } else if (isHTTPAccessFallbackError(error)) {
    return getAccessFallbackHTTPStatus(error);
  }

  return 500;
};

export const getLogLevelFromStatusCode = (statusCode: number): LogLevel => {
  if (statusCode >= 300 && statusCode < 400) {
    return LogLevel.info;
  } else if (statusCode >= 400 && statusCode < 500) {
    return LogLevel.warn;
  }
  return LogLevel.error;
};

export const defaultRouteHandlerOnSuccess = (logger: Logger, data: SuccessData) => {
  logger.info(...transformRouteHandlerSuccessResult(data));
  logger.flush();
};

const defaultRouteHandlerOnError = (logger: Logger, data: ErrorData) => {
  if (data.error instanceof Error) {
    logger.error(data.error.message, data.error);
  }
  const [message, report] = transformRouteHandlerErrorResult(data);
  logger.log(getLogLevelFromStatusCode(report.statusCsode), message, report);
  logger.flush();
};

const getStore = async <T = Request, C extends any = any>({
  store,
  req,
  ctx,
}: {
  store?:
    | ServerContextFields
    | ((req: T extends Request ? T : Request, ctx: C) => ServerContextFields | Promise<ServerContextFields>);
  req: T extends Request ? T : Request;
  ctx: C;
}) => {
  if (!store) {
    const newStore = new Map();
    newStore.set('request_id', crypto.randomUUID());
    return newStore;
  }
  if (typeof store === 'function') {
    return await store(req, ctx);
  }
  return store;
};

export const createAxiomRouteHandler = <TRequestCreateRouteHandler = NextRequest>(
  logger: Logger,
  config?: {
    store?:
      | ServerContextFields
      | (<TRequestStore = TRequestCreateRouteHandler, C extends any = any>(
          req: TRequestStore,
          ctx: C,
        ) => ServerContextFields | Promise<ServerContextFields>);
    onSuccess?: (data: SuccessData) => void;
    onError?: (data: ErrorData) => void;
  },
) => {
  const { store: argStore, onSuccess, onError } = config ?? {};
  const withAxiom = <TRequestRouteHandler = TRequestCreateRouteHandler>(handler: NextHandler<TRequestRouteHandler>) => {
    return async <C extends any = any>(
      req: TRequestRouteHandler extends Request ? TRequestRouteHandler : Request,
      ctx: C,
    ) => {
      const store = await getStore({ store: argStore, req, ctx });

      return runWithServerContext(async () => {
        const start = Date.now();

        try {
          const response = await handler(req, ctx);
          const end = Date.now();
          const httpData = { req, res: response, start, end };

          const callbackFn = async () => {
            if (onSuccess) {
              onSuccess(httpData);
            } else {
              defaultRouteHandlerOnSuccess(logger, httpData);
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
