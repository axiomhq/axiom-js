import { EVENT, LogLevel } from '@axiomhq/logging';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAxiomStartFunctionCorrelationMiddleware,
  createAxiomStartProxyHandler,
  createAxiomStartUncaughtErrorHandler,
  createAxiomStartFunctionMiddleware,
  createAxiomStartRequestMiddleware,
  getLogLevelFromStatusCode,
  transformStartUncaughtErrorResult,
  withAxiomStartErrorCapture,
  type StartFunctionClientContext,
  type StartFunctionContext,
  type StartRequestContext,
  type StartUncaughtErrorData,
  type TanStackCreateMiddleware,
} from '../../src/start';
import { mockLogger } from '../lib/mock';

const createMockCreateMiddleware = () => {
  const createMiddleware = vi.fn(() => ({
    client: (handler: unknown) => handler,
    server: (handler: unknown) => handler,
  }));

  return createMiddleware as unknown as TanStackCreateMiddleware;
};

describe('start middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs request middleware success with status-aware level', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger) as unknown as (
      context: StartRequestContext,
    ) => Promise<unknown>;

    const request = new Request('https://example.com/api/items?x=1', {
      method: 'POST',
      headers: {
        referer: 'https://example.com/home',
        'user-agent': 'vitest',
      },
    });
    const response = new Response('ok', { status: 201 });

    const context = {
      request,
      pathname: '/api/items',
      context: {},
      next: vi.fn().mockResolvedValue({
        request,
        response,
        pathname: '/api/items',
        context: {},
      }),
    } as unknown as StartRequestContext;

    const result = await middleware(context);

    expect(result).toEqual(
      expect.objectContaining({
        request,
        response,
      }),
    );
    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);

    const [level, message, report] = vi.mocked(mockLogger.log).mock.calls[0] as [
      string,
      string,
      Record<string | symbol, any>,
    ];

    expect(level).toBe(LogLevel.info);
    expect(message).toMatch(/POST \/api\/items 201 in \d+ms/);
    expect(report[EVENT].request.statusCode).toBe(201);
    expect(report[EVENT].source).toBe('tanstack-start-request');
  });

  it('logs request middleware error, flushes and rethrows', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger) as unknown as (
      context: StartRequestContext,
    ) => Promise<unknown>;

    const request = new Request('https://example.com/api/fail', { method: 'GET' });
    const error = Object.assign(new Error('request failed'), { statusCode: 503 });

    const context = {
      request,
      pathname: '/api/fail',
      context: {},
      next: vi.fn().mockRejectedValue(error),
    } as unknown as StartRequestContext;

    await expect(middleware(context)).rejects.toThrow(error);

    expect(mockLogger.error).toHaveBeenCalledWith('request failed', error);
    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);

    const [level, message, report] = vi.mocked(mockLogger.log).mock.calls[0] as [
      string,
      string,
      Record<string | symbol, any>,
    ];

    expect(level).toBe(LogLevel.error);
    expect(message).toMatch(/GET \/api\/fail 503 in \d+ms/);
    expect(report[EVENT].request.statusCode).toBe(503);
  });

  it('includes correlation id for request middleware when header is present', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger) as unknown as (
      context: StartRequestContext,
    ) => Promise<unknown>;

    const request = new Request('https://example.com/api/correlation', {
      method: 'POST',
      headers: {
        'x-axiom-correlation-id': 'corr-123',
      },
    });
    const response = new Response('ok', { status: 200 });

    const context = {
      request,
      pathname: '/api/correlation',
      context: {},
      next: vi.fn().mockResolvedValue({
        request,
        response,
        pathname: '/api/correlation',
        context: {},
      }),
    } as unknown as StartRequestContext;

    await middleware(context);

    const [, , report] = vi.mocked(mockLogger.log).mock.calls[0] as [
      string,
      string,
      Record<string | symbol, any>,
    ];
    expect(report[EVENT].request.requestId).toBe('corr-123');
  });

  it('supports custom request callbacks', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const onSuccess = vi.fn();

    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger, {
      onSuccess,
    }) as unknown as (context: StartRequestContext) => Promise<unknown>;

    const request = new Request('https://example.com/api/custom', { method: 'GET' });
    const response = new Response('ok', { status: 200 });

    const context = {
      request,
      pathname: '/api/custom',
      context: {},
      next: vi.fn().mockResolvedValue({ request, response, pathname: '/api/custom', context: {} }),
    } as unknown as StartRequestContext;

    await middleware(context);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).not.toHaveBeenCalled();
    expect(mockLogger.flush).not.toHaveBeenCalled();
  });

  it('logs function middleware success and omits data by default', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartFunctionMiddleware(createMiddleware, mockLogger) as unknown as (
      context: StartFunctionContext,
    ) => Promise<unknown>;

    const request = new Request('https://example.com/_server/data', { method: 'POST' });
    const result = {
      'use functions must return the result of next()': true,
      context: {},
      sendContext: {},
    };

    const context = {
      data: { secret: 'value' },
      method: 'POST',
      signal: new AbortController().signal,
      context: {
        request,
        request_id: 'corr-server-1',
      },
      serverFnMeta: {
        id: 'fn-id',
        name: 'getData',
        filename: 'src/routes/data.ts',
      },
      next: vi.fn().mockResolvedValue(result),
    } as unknown as StartFunctionContext;

    const output = await middleware(context);

    expect(output).toBe(result);
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);

    const [message, report] = vi.mocked(mockLogger.info).mock.calls[0] as [string, Record<string | symbol, any>];

    expect(message).toMatch(/getData completed in \d+ms/);
    expect(report[EVENT].source).toBe('tanstack-start-function');
    expect(report[EVENT].function.functionId).toBe('getData');
    expect(report[EVENT].function.requestId).toBe('corr-server-1');
    expect(report.data).toBeUndefined();
  });

  it('includes function data when includeData is enabled', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartFunctionMiddleware(createMiddleware, mockLogger, {
      includeData: true,
    }) as unknown as (context: StartFunctionContext) => Promise<unknown>;

    const result = {
      'use functions must return the result of next()': true,
      context: {},
      sendContext: {},
    };

    const context = {
      data: { requestId: 'abc' },
      method: 'POST',
      signal: new AbortController().signal,
      context: {},
      serverFnMeta: {
        id: 'fn-id',
      },
      next: vi.fn().mockResolvedValue(result),
    } as unknown as StartFunctionContext;

    await middleware(context);

    const [, report] = vi.mocked(mockLogger.info).mock.calls[0] as [string, Record<string | symbol, any>];
    expect(report.data).toEqual({ requestId: 'abc' });
  });

  it('adds correlation context and header in function client middleware', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartFunctionCorrelationMiddleware(createMiddleware, {
      createRequestId: () => 'corr-generated',
    }) as unknown as (context: StartFunctionClientContext) => Promise<unknown>;

    const nextResult = {
      'use functions must return the result of next()': true,
      context: {},
      sendContext: {},
      headers: {},
    };
    const next = vi.fn().mockResolvedValue(nextResult);

    const context = {
      data: undefined,
      context: undefined,
      sendContext: {},
      method: 'GET',
      signal: new AbortController().signal,
      serverFnMeta: { id: 'fn-client' },
      filename: 'src/routes/index.tsx',
      next,
    } as unknown as StartFunctionClientContext;

    const result = await middleware(context);

    expect(result).toBe(nextResult);
    expect(next).toHaveBeenCalledWith({
      sendContext: {
        request_id: 'corr-generated',
        axiom_correlation_id: 'corr-generated',
      },
      headers: {
        'x-axiom-correlation-id': 'corr-generated',
      },
    });
  });

  it('reuses existing request_id in function client middleware', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartFunctionCorrelationMiddleware(createMiddleware) as unknown as (
      context: StartFunctionClientContext,
    ) => Promise<unknown>;

    const next = vi.fn().mockResolvedValue({
      'use functions must return the result of next()': true,
      context: {},
      sendContext: {},
      headers: {},
    });

    const context = {
      data: undefined,
      context: undefined,
      sendContext: { request_id: 'corr-existing' },
      method: 'POST',
      signal: new AbortController().signal,
      serverFnMeta: { id: 'fn-client-existing' },
      filename: 'src/routes/index.tsx',
      next,
    } as unknown as StartFunctionClientContext;

    await middleware(context);

    expect(next).toHaveBeenCalledWith({
      sendContext: {
        request_id: 'corr-existing',
        axiom_correlation_id: 'corr-existing',
      },
      headers: {
        'x-axiom-correlation-id': 'corr-existing',
      },
    });
  });

  it('supports correlation through createAxiomStartFunctionMiddleware config', async () => {
    const createMiddleware = vi.fn(() => ({
      client: (clientHandler: unknown) => ({
        server: (serverHandler: unknown) => ({
          clientHandler,
          serverHandler,
        }),
      }),
      server: (serverHandler: unknown) => serverHandler,
    })) as unknown as TanStackCreateMiddleware;

    const middleware = createAxiomStartFunctionMiddleware(createMiddleware, mockLogger, {
      correlation: {
        createRequestId: () => 'corr-from-config',
      },
    }) as unknown as {
      clientHandler: (context: StartFunctionClientContext) => Promise<unknown>;
    };

    const next = vi.fn().mockResolvedValue({
      'use functions must return the result of next()': true,
      context: {},
      sendContext: {},
      headers: {},
    });

    await middleware.clientHandler({
      data: undefined,
      context: undefined,
      sendContext: {},
      method: 'POST',
      signal: new AbortController().signal,
      serverFnMeta: { id: 'fn-client-config' },
      filename: 'src/routes/index.tsx',
      next,
    } as unknown as StartFunctionClientContext);

    expect(next).toHaveBeenCalledWith({
      sendContext: {
        request_id: 'corr-from-config',
        axiom_correlation_id: 'corr-from-config',
      },
      headers: {
        'x-axiom-correlation-id': 'corr-from-config',
      },
    });
  });

  it('logs function middleware error, flushes and rethrows', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartFunctionMiddleware(createMiddleware, mockLogger) as unknown as (
      context: StartFunctionContext,
    ) => Promise<unknown>;

    const error = new Error('function failed');

    const context = {
      data: { id: 1 },
      method: 'POST',
      signal: new AbortController().signal,
      context: {},
      serverFnMeta: {
        id: 'fn-fail',
      },
      next: vi.fn().mockRejectedValue(error),
    } as unknown as StartFunctionContext;

    await expect(middleware(context)).rejects.toThrow(error);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);

    const lastErrorCall = vi.mocked(mockLogger.error).mock.calls.at(-1) as [string, Record<string | symbol, any>];
    expect(lastErrorCall[0]).toMatch(/failed in \d+ms/);
    expect(lastErrorCall[1][EVENT].source).toBe('tanstack-start-function');
  });

  it('supports include/exclude request matching', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger, {
      include: '/api/*',
      exclude: '/api/internal/*',
    }) as unknown as (context: StartRequestContext) => Promise<unknown>;

    const request = new Request('https://example.com/api/internal/health', { method: 'GET' });

    const context = {
      request,
      pathname: '/api/internal/health',
      context: {},
      next: vi.fn().mockResolvedValue({
        request,
        response: new Response('ok', { status: 200 }),
        pathname: '/api/internal/health',
        context: {},
      }),
    } as unknown as StartRequestContext;

    await middleware(context);

    expect(mockLogger.log).not.toHaveBeenCalled();
    expect(mockLogger.flush).not.toHaveBeenCalled();
  });

  it('supports shouldLog callback for request middleware', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger, {
      shouldLog: (ctx) => ctx.request.method !== 'OPTIONS',
    }) as unknown as (context: StartRequestContext) => Promise<unknown>;

    const request = new Request('https://example.com/api/items', { method: 'OPTIONS' });

    const context = {
      request,
      pathname: '/api/items',
      context: {},
      next: vi.fn().mockResolvedValue({
        request,
        response: new Response(null, { status: 204 }),
        pathname: '/api/items',
        context: {},
      }),
    } as unknown as StartRequestContext;

    await middleware(context);

    expect(mockLogger.log).not.toHaveBeenCalled();
    expect(mockLogger.flush).not.toHaveBeenCalled();
  });

  it('supports custom request log level strategy', async () => {
    const createMiddleware = createMockCreateMiddleware();
    const middleware = createAxiomStartRequestMiddleware(createMiddleware, mockLogger, {
      logLevelByStatusCode: () => LogLevel.debug,
    }) as unknown as (context: StartRequestContext) => Promise<unknown>;

    const request = new Request('https://example.com/api/teapot', { method: 'GET' });
    const response = new Response('teapot', { status: 418 });

    const context = {
      request,
      pathname: '/api/teapot',
      context: {},
      next: vi.fn().mockResolvedValue({
        request,
        response,
        pathname: '/api/teapot',
        context: {},
      }),
    } as unknown as StartRequestContext;

    await middleware(context);

    expect(mockLogger.log).toHaveBeenCalledWith(
      LogLevel.debug,
      expect.stringContaining('GET /api/teapot 418 in'),
      expect.any(Object),
    );
  });

  it('creates a proxy handler that ingests events and returns ok', async () => {
    const handler = createAxiomStartProxyHandler(mockLogger);
    const request = new Request('https://example.com/api/axiom', {
      method: 'POST',
      body: JSON.stringify([
        { level: 'info', message: 'one' },
        { level: 'error', message: 'two' },
      ]),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
    expect(mockLogger.raw).toHaveBeenCalledTimes(2);
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('proxy handler returns error when payload is invalid', async () => {
    const handler = createAxiomStartProxyHandler(mockLogger);
    const request = new Request('https://example.com/api/axiom', {
      method: 'POST',
      body: JSON.stringify({ invalid: true }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handler(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ status: 'error' });
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('exposes default status-code log level strategy', () => {
    expect(getLogLevelFromStatusCode(200)).toBe(LogLevel.info);
    expect(getLogLevelFromStatusCode(404)).toBe(LogLevel.warn);
    expect(getLogLevelFromStatusCode(500)).toBe(LogLevel.error);
  });

  it('transforms uncaught server errors', () => {
    const request = new Request('https://example.com/api/fail', {
      method: 'POST',
      headers: {
        referer: 'https://example.com',
        'user-agent': 'vitest',
      },
    });

    const [message, report] = transformStartUncaughtErrorResult({
      error: new Error('boom'),
      request,
      phase: 'server-entry',
    });

    expect(message).toBe('boom (server-entry)');
    expect(report).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          name: 'Error',
          message: 'boom',
        }),
        [EVENT]: {
          source: 'tanstack-start-uncaught',
          phase: 'server-entry',
          request: {
            path: '/api/fail',
            method: 'POST',
            host: 'example.com',
            userAgent: 'vitest',
            scheme: 'https',
            referer: 'https://example.com',
          },
        },
      }),
    );
  });

  it('creates uncaught error handler that logs and flushes', async () => {
    const onUncaughtError = createAxiomStartUncaughtErrorHandler(mockLogger);
    const data: StartUncaughtErrorData = {
      error: new Error('uncaught'),
      phase: 'start-handler',
    };

    await onUncaughtError(data);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'uncaught (start-handler)',
      expect.objectContaining({
        [EVENT]: expect.objectContaining({
          source: 'tanstack-start-uncaught',
          phase: 'start-handler',
        }),
      }),
    );
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('wraps server entry handlers and rethrows by default', async () => {
    const error = new Error('entry failed');
    const handler = vi.fn(async () => {
      throw error;
    });
    const wrapped = withAxiomStartErrorCapture(handler, mockLogger);
    const request = new Request('https://example.com/');

    await expect(wrapped(request)).rejects.toThrow(error);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'entry failed (server-entry)',
      expect.objectContaining({
        [EVENT]: expect.objectContaining({
          source: 'tanstack-start-uncaught',
          phase: 'server-entry',
        }),
      }),
    );
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('can return fallback response instead of rethrowing', async () => {
    const wrapped = withAxiomStartErrorCapture(
      async (_request: Request) => {
        throw new Error('no rethrow');
      },
      mockLogger,
      { rethrow: false },
    );

    const response = await wrapped(new Request('https://example.com/'));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ status: 'error' });
  });

  it('supports custom uncaught onError callback', async () => {
    const onError = vi.fn();
    const wrapped = withAxiomStartErrorCapture(
      async (_request: Request) => {
        throw new Error('custom');
      },
      mockLogger,
      {
        onError,
        rethrow: false,
        phase: 'start-handler',
      },
    );

    await wrapped(new Request('https://example.com/api/custom'));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });
});
