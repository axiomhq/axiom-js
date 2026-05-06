import {
  EVENT,
  Logger,
  LogLevel,
  type Formatter,
  type LogEvent,
  type LogLevel as LogLevelType,
} from '@axiomhq/logging';
import type {
  FunctionMiddlewareClientFnOptions,
  FunctionMiddlewareServerFnOptions,
  createMiddleware,
  RequestServerOptions,
} from '@tanstack/start-client-core' with { 'resolution-mode': 'import' };
import { frameworkIdentifierFormatter } from './identifier';
import {
  getServerContextStore,
  runWithServerContext,
  startServerContextFieldsFormatter,
  type ServerContextFields,
} from './context';

const START_REQUEST_SOURCE = 'tanstack-start-request';
const START_FUNCTION_SOURCE = 'tanstack-start-function';
const START_UNCAUGHT_SOURCE = 'tanstack-start-uncaught';
const START_CORRELATION_HEADER = 'x-logging-correlation-id';
const START_CORRELATION_CONTEXT_KEY = 'logging_correlation_id';
const REQUEST_ID_FIELD = 'request_id';

type MaybePromise<T> = T | Promise<T>;

type LogReport = Record<string | symbol, unknown>;

type ContextStoreFactory<TContext> = (context: TContext) => MaybePromise<ServerContextFields>;
type StartRequestMatcher = string | RegExp | ((context: StartRequestContext) => MaybePromise<boolean>);

export interface StartProxyHandlerConfig {
  onSuccess?: (events: LogEvent[]) => MaybePromise<void>;
  onError?: (error: unknown) => MaybePromise<void>;
}

export type StartUncaughtErrorPhase = 'server-entry' | 'start-handler' | 'process';

export interface StartUncaughtErrorData {
  error: unknown;
  request?: Request;
  phase: StartUncaughtErrorPhase;
}

export interface StartUncaughtErrorCaptureConfig {
  source?: string;
  phase?: StartUncaughtErrorPhase;
  rethrow?: boolean;
  onError?: (data: StartUncaughtErrorData, report: LogReport) => MaybePromise<void>;
  createResponse?: (data: StartUncaughtErrorData) => MaybePromise<Response>;
}

export type StartRequestContext = RequestServerOptions<any, any>;
export type StartFunctionContext = FunctionMiddlewareServerFnOptions<any, any, any, any>;
export type StartFunctionClientContext = FunctionMiddlewareClientFnOptions<any, any, any>;

export type TanStackCreateMiddleware = typeof createMiddleware;

export interface StartRequestSuccessData {
  request: Request;
  response: Response;
  startTime: number;
  endTime: number;
}

export interface StartRequestErrorData {
  request: Request;
  error: unknown;
  startTime: number;
  endTime: number;
}

export interface StartFunctionSuccessData {
  context: StartFunctionContext;
  result: unknown;
  startTime: number;
  endTime: number;
}

export interface StartFunctionErrorData {
  context: StartFunctionContext;
  error: unknown;
  startTime: number;
  endTime: number;
}

export interface StartRequestMiddlewareConfig {
  include?: StartRequestMatcher | StartRequestMatcher[];
  exclude?: StartRequestMatcher | StartRequestMatcher[];
  store?: ServerContextFields | ContextStoreFactory<StartRequestContext>;
  onSuccess?: (data: StartRequestSuccessData) => MaybePromise<void>;
  onError?: (data: StartRequestErrorData) => MaybePromise<void>;
}

export interface StartFunctionMiddlewareConfig {
  correlation?: boolean | StartFunctionCorrelationMiddlewareConfig;
  store?: ServerContextFields | ContextStoreFactory<StartFunctionContext>;
  onSuccess?: (data: StartFunctionSuccessData) => MaybePromise<void>;
  onError?: (data: StartFunctionErrorData) => MaybePromise<void>;
}

export interface StartFunctionCorrelationMiddlewareConfig {
  headerName?: string;
  contextKey?: string;
  createRequestId?: () => string;
}

export const tanStackStartServerFormatters: Formatter[] = [
  frameworkIdentifierFormatter,
  startServerContextFieldsFormatter,
];

const createRequestId = () => {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const getStringField = (value: unknown, key: string) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const field = value[key];
  if (typeof field !== 'string' || field.length === 0) {
    return undefined;
  }

  return field;
};

const getRequestIdFromStore = (store: ServerContextFields | undefined) => {
  if (!store) {
    return undefined;
  }

  if (store instanceof Map) {
    const field = store.get(REQUEST_ID_FIELD);
    return typeof field === 'string' && field.length > 0 ? field : undefined;
  }

  const field = store[REQUEST_ID_FIELD];
  return typeof field === 'string' && field.length > 0 ? field : undefined;
};

const getRequestIdFromRequest = (request: Request) => {
  const fromAxiomHeader = request.headers.get(START_CORRELATION_HEADER);
  if (fromAxiomHeader && fromAxiomHeader.length > 0) {
    return fromAxiomHeader;
  }

  const fromRequestHeader = request.headers.get('x-request-id');
  if (fromRequestHeader && fromRequestHeader.length > 0) {
    return fromRequestHeader;
  }

  return undefined;
};

const getRequestFromFunctionContext = (context: StartFunctionContext): Request | undefined => {
  const requestFromContext =
    context.context && typeof context.context === 'object' && 'request' in context.context
      ? (context.context as { request?: unknown }).request
      : undefined;

  return requestFromContext instanceof Request ? requestFromContext : undefined;
};

const getFunctionContextRequestId = (context: StartFunctionContext) => {
  const fromContext =
    getStringField(context.context, REQUEST_ID_FIELD) ?? getStringField(context.context, START_CORRELATION_CONTEXT_KEY);
  if (fromContext) {
    return fromContext;
  }

  const request = getRequestFromFunctionContext(context);
  return request ? getRequestIdFromRequest(request) : undefined;
};

const mergeRequestIdIntoStore = (store: ServerContextFields, requestId: string | undefined): ServerContextFields => {
  if (!requestId) {
    return store;
  }

  if (store instanceof Map) {
    const existing = store.get(REQUEST_ID_FIELD);
    if (typeof existing !== 'string' || existing.length === 0) {
      store.set(REQUEST_ID_FIELD, requestId);
    }

    return store;
  }

  const existing = store[REQUEST_ID_FIELD];
  if (typeof existing === 'string' && existing.length > 0) {
    return store;
  }

  return {
    ...store,
    [REQUEST_ID_FIELD]: requestId,
  };
};

const mergeSourceIntoStore = (store: ServerContextFields, source: string): ServerContextFields => {
  if (store instanceof Map) {
    const eventValue = store.get(EVENT);
    const eventFields = eventValue && typeof eventValue === 'object' ? eventValue : {};
    store.set(EVENT, { ...eventFields, source });
    return store;
  }

  const eventValue = store[EVENT];
  const eventFields = eventValue && typeof eventValue === 'object' ? eventValue : {};
  return {
    ...store,
    [EVENT]: {
      ...eventFields,
      source,
    },
  };
};

const resolveStore = async <TContext>(
  source: string,
  context: TContext,
  store?: ServerContextFields | ContextStoreFactory<TContext>,
  requestId?: string,
): Promise<ServerContextFields> => {
  const resolvedRequestId = requestId ?? getRequestIdFromStore(getServerContextStore()) ?? createRequestId();

  if (!store) {
    const nextStore = new Map<string | typeof EVENT, unknown>();
    nextStore.set(REQUEST_ID_FIELD, resolvedRequestId);
    nextStore.set(EVENT, { source });
    return nextStore;
  }

  if (typeof store === 'function') {
    const resolvedStore = mergeSourceIntoStore(await store(context), source);
    return mergeRequestIdIntoStore(resolvedStore, resolvedRequestId);
  }

  const resolvedStore = mergeSourceIntoStore(store, source);
  return mergeRequestIdIntoStore(resolvedStore, resolvedRequestId);
};

export const getStartErrorStatusCode = (error: unknown): number => {
  if (!error || typeof error !== 'object') {
    return 500;
  }

  const typedError = error as Record<string, unknown>;
  const statusCode = typedError.statusCode ?? typedError.status;

  if (typeof statusCode === 'number') {
    return statusCode;
  }

  return 500;
};

export const getLogLevelFromStatusCode = (statusCode: number): LogLevelType => {
  if (statusCode < 400) {
    return LogLevel.info;
  }

  if (statusCode < 500) {
    return LogLevel.warn;
  }

  return LogLevel.error;
};

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (typeof value === 'undefined') {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const matchesStringMatcher = (matcher: string | RegExp, values: Array<string | undefined>) => {
  const targets = values.filter((value): value is string => Boolean(value));

  if (matcher instanceof RegExp) {
    return targets.some((value) => matcher.test(value));
  }

  if (matcher.endsWith('*')) {
    const prefix = matcher.slice(0, -1);
    return targets.some((value) => value.startsWith(prefix));
  }

  return targets.includes(matcher);
};

const getRequestPath = (requestContext: StartRequestContext) => {
  if (requestContext.pathname) {
    return requestContext.pathname;
  }

  try {
    return new URL(requestContext.request.url).pathname;
  } catch {
    return requestContext.request.url;
  }
};

const matchesRequestMatcher = async (matcher: StartRequestMatcher, requestContext: StartRequestContext) => {
  if (typeof matcher === 'function') {
    return await matcher(requestContext);
  }

  return matchesStringMatcher(matcher, [getRequestPath(requestContext)]);
};

const matchesMiddlewareConfig = async <TMatcher>(
  include: TMatcher | TMatcher[] | undefined,
  exclude: TMatcher | TMatcher[] | undefined,
  matches: (matcher: TMatcher) => MaybePromise<boolean>,
) => {
  const includeMatchers = asArray(include);
  if (includeMatchers.length > 0) {
    const includeResults = await Promise.all(includeMatchers.map((matcher) => matches(matcher)));
    if (!includeResults.some(Boolean)) {
      return false;
    }
  }

  const excludeMatchers = asArray(exclude);
  if (excludeMatchers.length > 0) {
    const excludeResults = await Promise.all(excludeMatchers.map((matcher) => matches(matcher)));
    if (excludeResults.some(Boolean)) {
      return false;
    }
  }

  return true;
};

const matchesRequestConfig = (requestContext: StartRequestContext, config: StartRequestMiddlewareConfig) => {
  return matchesMiddlewareConfig(config.include, config.exclude, (matcher) => matchesRequestMatcher(matcher, requestContext));
};

const getRequestMetadata = (
  request: Request,
  statusCode: number,
  startTime: number,
  endTime: number,
  requestId?: string,
) => {
  const url = new URL(request.url);

  return {
    startTime,
    endTime,
    durationMs: endTime - startTime,
    path: url.pathname,
    method: request.method,
    host: url.hostname,
    userAgent: request.headers.get('user-agent'),
    scheme: url.protocol.replace(':', ''),
    referer: request.headers.get('referer'),
    statusCode,
    requestId,
  };
};

const getFunctionMetadata = (context: StartFunctionContext, startTime: number, endTime: number) => {
  const serverFnMeta = context.serverFnMeta;
  const functionId = serverFnMeta?.name ?? serverFnMeta?.id;

  const request = getRequestFromFunctionContext(context);
  const url = request ? new URL(request.url) : undefined;

  return {
    startTime,
    endTime,
    durationMs: endTime - startTime,
    functionId: typeof functionId === 'string' ? functionId : undefined,
    functionName: serverFnMeta?.name,
    functionFile: serverFnMeta?.filename,
    path: url?.pathname,
    method: context.method ?? request?.method,
    hasData: typeof context.data !== 'undefined',
    requestId: getFunctionContextRequestId(context),
  };
};

export const transformStartRequestSuccessResult = (
  data: StartRequestSuccessData,
): [message: string, report: LogReport] => {
  const request = getRequestMetadata(
    data.request,
    data.response.status,
    data.startTime,
    data.endTime,
    getRequestIdFromRequest(data.request),
  );

  return [
    `${request.method} ${request.path} ${request.statusCode} in ${request.durationMs}ms`,
    {
      [EVENT]: {
        request,
        source: START_REQUEST_SOURCE,
      },
    },
  ];
};

export const transformStartRequestErrorResult = (data: StartRequestErrorData): [message: string, report: LogReport] => {
  const statusCode = getStartErrorStatusCode(data.error);
  const request = getRequestMetadata(
    data.request,
    statusCode,
    data.startTime,
    data.endTime,
    getRequestIdFromRequest(data.request),
  );

  return [
    `${request.method} ${request.path} ${request.statusCode} in ${request.durationMs}ms`,
    {
      [EVENT]: {
        request,
        source: START_REQUEST_SOURCE,
      },
    },
  ];
};

export const transformStartFunctionSuccessResult = (
  data: StartFunctionSuccessData,
): [message: string, report: LogReport] => {
  const fn = getFunctionMetadata(data.context, data.startTime, data.endTime);
  return [
    `${fn.functionId ?? 'server function'} completed in ${fn.durationMs}ms`,
    {
      [EVENT]: {
        function: fn,
        source: START_FUNCTION_SOURCE,
      },
    },
  ];
};

export const transformStartFunctionErrorResult = (
  data: StartFunctionErrorData,
): [message: string, report: LogReport] => {
  const fn = getFunctionMetadata(data.context, data.startTime, data.endTime);
  return [
    `${fn.functionId ?? 'server function'} failed in ${fn.durationMs}ms`,
    {
      [EVENT]: {
        function: fn,
        source: START_FUNCTION_SOURCE,
      },
    },
  ];
};

const getUncaughtRequestMetadata = (request: Request) => {
  const url = new URL(request.url);

  return {
    path: url.pathname,
    method: request.method,
    host: url.hostname,
    userAgent: request.headers.get('user-agent'),
    scheme: url.protocol.replace(':', ''),
    referer: request.headers.get('referer'),
  };
};

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

export const transformStartUncaughtErrorResult = (
  data: StartUncaughtErrorData,
  source = START_UNCAUGHT_SOURCE,
): [message: string, report: LogReport] => {
  const message = data.error instanceof Error ? data.error.message : 'Unhandled server error';

  return [
    `${message} (${data.phase})`,
    {
      error: normalizeError(data.error),
      [EVENT]: {
        source,
        phase: data.phase,
        request: data.request ? getUncaughtRequestMetadata(data.request) : undefined,
      },
    },
  ];
};

const defaultUncaughtOnError = async (logger: Logger, data: StartUncaughtErrorData, source = START_UNCAUGHT_SOURCE) => {
  const [message, report] = transformStartUncaughtErrorResult(data, source);
  logger.error(message, report);
  await logger.flush();
};

export const createAxiomUncaughtErrorHandler = (logger: Logger, config: StartUncaughtErrorCaptureConfig = {}) => {
  const { onError, source = START_UNCAUGHT_SOURCE } = config;

  return async (data: StartUncaughtErrorData) => {
    if (onError) {
      const [, report] = transformStartUncaughtErrorResult(data, source);
      await onError(data, report);
      await logger.flush();
      return;
    }

    await defaultUncaughtOnError(logger, data, source);
  };
};

export const captureError = <TArgs extends unknown[], TResult>(
  handler: (request: Request, ...args: TArgs) => MaybePromise<TResult>,
  logger: Logger,
  config: StartUncaughtErrorCaptureConfig = {},
): ((request: Request, ...args: TArgs) => Promise<TResult | Response>) => {
  const { phase = 'server-entry', rethrow = true, createResponse } = config;
  const onUncaughtError = createAxiomUncaughtErrorHandler(logger, config);

  return async (request: Request, ...args: TArgs) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      await onUncaughtError({
        error,
        request,
        phase,
      });

      if (rethrow) {
        throw error;
      }

      if (createResponse) {
        return await createResponse({
          error,
          request,
          phase,
        });
      }

      return Response.json({ status: 'error' }, { status: 500 });
    }
  };
};

const defaultRequestOnSuccess = async (logger: Logger, data: StartRequestSuccessData) => {
  const [message, report] = transformStartRequestSuccessResult(data);
  const logLevel = getLogLevelFromStatusCode(data.response.status);
  logger.log(logLevel, message, report);
  await logger.flush();
};

const defaultRequestOnError = async (logger: Logger, data: StartRequestErrorData) => {
  if (data.error instanceof Error) {
    logger.error(data.error.message, data.error);
  }

  const [message, report] = transformStartRequestErrorResult(data);
  const statusCode = getStartErrorStatusCode(data.error);
  const logLevel = getLogLevelFromStatusCode(statusCode);
  logger.log(logLevel, message, report);
  await logger.flush();
};

const defaultFunctionOnSuccess = async (logger: Logger, data: StartFunctionSuccessData) => {
  const [message, report] = transformStartFunctionSuccessResult(data);
  logger.info(message, report);
  await logger.flush();
};

const defaultFunctionOnError = async (logger: Logger, data: StartFunctionErrorData) => {
  if (data.error instanceof Error) {
    logger.error(data.error.message, data.error);
  }

  const [message, report] = transformStartFunctionErrorResult(data);
  logger.error(message, report);
  await logger.flush();
};

export const createAxiomRequestMiddleware = (
  createMiddleware: TanStackCreateMiddleware,
  logger: Logger,
  config: StartRequestMiddlewareConfig = {},
) => {
  const { store, onSuccess, onError } = config;

  return createMiddleware({ type: 'request' }).server(async (requestContext: StartRequestContext) => {
    const requestMatchesConfig = await matchesRequestConfig(requestContext, config);
    if (!requestMatchesConfig) {
      return requestContext.next();
    }

    const contextStore = await resolveStore(
      START_REQUEST_SOURCE,
      requestContext,
      store,
      getRequestIdFromRequest(requestContext.request),
    );

    return runWithServerContext(async () => {
      const startTime = Date.now();

      try {
        const nextResult = await requestContext.next();
        const response = nextResult.response;
        const request = nextResult.request;
        const endTime = Date.now();

        const data = {
          request,
          response,
          startTime,
          endTime,
        } satisfies StartRequestSuccessData;

        if (onSuccess) {
          await onSuccess(data);
        } else {
          await defaultRequestOnSuccess(logger, data);
        }

        return nextResult;
      } catch (error) {
        const endTime = Date.now();

        const data = {
          request: requestContext.request,
          error,
          startTime,
          endTime,
        } satisfies StartRequestErrorData;

        if (onError) {
          await onError(data);
        } else {
          await defaultRequestOnError(logger, data);
        }

        throw error;
      }
    }, contextStore);
  });
};

const isLogEventArray = (value: unknown): value is LogEvent[] => {
  return Array.isArray(value);
};

export const createAxiomProxyHandler = (logger: Logger, config: StartProxyHandlerConfig = {}) => {
  const { onSuccess, onError } = config;

  return async (request: Request) => {
    try {
      const body = (await request.json()) as unknown;
      if (!isLogEventArray(body)) {
        throw new Error('Expected request body to be a JSON array of log events');
      }

      body.forEach((event) => logger.raw(event));

      if (onSuccess) {
        await onSuccess(body);
      }

      await logger.flush();
      return Response.json({ status: 'ok' });
    } catch (error) {
      if (onError) {
        await onError(error);
      } else if (error instanceof Error) {
        logger.error(error.message, error);
      } else {
        logger.error('Failed to process proxy request', { error });
      }

      await logger.flush();
      return Response.json({ status: 'error' }, { status: 500 });
    }
  };
};

const createFunctionCorrelationClientHandler = (config: StartFunctionCorrelationMiddlewareConfig = {}) => {
  const {
    contextKey = START_CORRELATION_CONTEXT_KEY,
    headerName = START_CORRELATION_HEADER,
    createRequestId: createId = createRequestId,
  } = config;

  return async (functionContext: StartFunctionClientContext) => {
    const existingRequestId =
      getStringField(functionContext.sendContext, REQUEST_ID_FIELD) ??
      getStringField(functionContext.sendContext, contextKey);
    const requestId = existingRequestId ?? createId();

    const sendContext =
      functionContext.sendContext && typeof functionContext.sendContext === 'object'
        ? (functionContext.sendContext as Record<string, {}>)
        : {};

    return functionContext.next({
      sendContext: {
        ...sendContext,
        [REQUEST_ID_FIELD]: requestId,
        [contextKey]: requestId,
      },
      headers: {
        [headerName]: requestId,
      },
    });
  };
};

export const createAxiomFunctionCorrelationMiddleware = (
  createMiddleware: TanStackCreateMiddleware,
  config: StartFunctionCorrelationMiddlewareConfig = {},
) => {
  return createMiddleware({ type: 'function' }).client(createFunctionCorrelationClientHandler(config));
};

export const createAxiomMiddleware = (
  createMiddleware: TanStackCreateMiddleware,
  logger: Logger,
  config: StartFunctionMiddlewareConfig = {},
) => {
  const { correlation = false, store, onSuccess, onError } = config;
  const correlationConfig = correlation === true ? {} : correlation || undefined;

  const serverMiddleware = async (functionContext: StartFunctionContext) => {
    const contextStore = await resolveStore(
      START_FUNCTION_SOURCE,
      functionContext,
      store,
      getFunctionContextRequestId(functionContext),
    );

    return runWithServerContext(async () => {
      const startTime = Date.now();

      try {
        const result = await functionContext.next();
        const endTime = Date.now();

        const data = {
          context: functionContext,
          result,
          startTime,
          endTime,
        } satisfies StartFunctionSuccessData;

        if (onSuccess) {
          await onSuccess(data);
        } else {
          await defaultFunctionOnSuccess(logger, data);
        }

        return result;
      } catch (error) {
        const endTime = Date.now();

        const data = {
          context: functionContext,
          error,
          startTime,
          endTime,
        } satisfies StartFunctionErrorData;

        if (onError) {
          await onError(data);
        } else {
          await defaultFunctionOnError(logger, data);
        }

        throw error;
      }
    }, contextStore);
  };

  if (correlationConfig) {
    return createMiddleware({ type: 'function' })
      .client(createFunctionCorrelationClientHandler(correlationConfig))
      .server(serverMiddleware);
  }

  return createMiddleware({ type: 'function' }).server(serverMiddleware);
};
