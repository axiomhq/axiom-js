import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  createAxiomRouteHandler,
  getLogLevelFromStatusCode,
  getNextErrorStatusCode,
  transformRouteHandlerSuccessResult,
  transformRouteHandlerErrorResult,
} from '../../src/routeHandler';
import { mockLogger } from '../lib/mock';
import { LogLevel } from '@axiomhq/logging';
import { forbidden, notFound, permanentRedirect, redirect, unauthorized } from 'next/navigation';

describe('routeHandler', () => {
  describe('createAxiomRouteHandler', () => {
    it('should handle successful requests', async () => {
      const withAxiom = createAxiomRouteHandler({ logger: mockLogger });
      const mockResponse = new NextResponse(null, { status: 200 });
      const handler = vi.fn().mockResolvedValue(mockResponse);
      const wrappedHandler = withAxiom(handler);

      const mockReq = new NextRequest('http://example.com/test', { method: 'GET' });
      const result = await wrappedHandler(mockReq, {});

      expect(handler).toHaveBeenCalledWith(mockReq, {});
      expect(result).toBe(mockResponse);
    });

    it('should handle errors and rethrow them', async () => {
      const withAxiom = createAxiomRouteHandler({ logger: mockLogger });
      const error = new Error('Test error');
      const handler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = withAxiom(handler);

      const mockReq = new NextRequest('http://example.com/test', { method: 'GET' });
      await expect(wrappedHandler(mockReq, {})).rejects.toThrow(error);
    });
  });

  describe('getLogLevelFromStatusCode', () => {
    it('should return info for 3xx status codes', () => {
      expect(getLogLevelFromStatusCode(301)).toBe(LogLevel.info);
      expect(getLogLevelFromStatusCode(302)).toBe(LogLevel.info);
    });

    it('should return warn for 4xx status codes', () => {
      expect(getLogLevelFromStatusCode(400)).toBe(LogLevel.warn);
      expect(getLogLevelFromStatusCode(404)).toBe(LogLevel.warn);
    });

    it('should return error for 5xx status codes', () => {
      expect(getLogLevelFromStatusCode(500)).toBe(LogLevel.error);
      expect(getLogLevelFromStatusCode(503)).toBe(LogLevel.error);
    });
  });

  describe('getNextErrorStatusCode', () => {
    const getErrorFromFunction = async (fn: () => void) => {
      return (await (async () => fn())().catch((err) => err)) as Error & { digest?: string };
    };

    it('should return 500 for errors without digest', () => {
      const error = new Error('Test error');
      expect(getNextErrorStatusCode(error)).toBe(500);
    });

    it('should extract status code from temporary redirect error', async () => {
      const error = await getErrorFromFunction(() => redirect('/path'));
      expect(getNextErrorStatusCode(error)).toBe('307');
    });

    it('should extract status code from permanent redirect error', async () => {
      const error = await getErrorFromFunction(() => permanentRedirect('/path'));
      expect(getNextErrorStatusCode(error)).toBe('308');
    });

    it('should extract status code from not found error', async () => {
      const error = await getErrorFromFunction(() => notFound());
      expect(getNextErrorStatusCode(error)).toBe('404');
    });

    it('should extract status code from forbidden error', async () => {
      const error = await getErrorFromFunction(() => forbidden());
      expect(getNextErrorStatusCode(error)).toBe('403');
    });

    it('should extract status code from unahtorized error', async () => {
      const error = await getErrorFromFunction(() => unauthorized());
      expect(getNextErrorStatusCode(error)).toBe('401');
    });
  });

  describe('transform functions', () => {
    const mockReq = new NextRequest('http://example.com/test', {
      method: 'GET',
      headers: { host: 'example.com', 'user-agent': 'test', 'x-forwarded-for': '127.0.0.1' },
    });

    const testReport = {
      method: 'GET',
      path: '/test',
      host: 'example.com',
      userAgent: 'test',
      scheme: 'http',
      ip: '127.0.0.1',
      region: '',
    };

    it('should transform success result correctly', () => {
      const mockRes = new NextResponse(null, { status: 200 });
      const data = {
        req: mockReq,
        res: mockRes,
        start: 1000,
        end: 1100,
      };

      const [message, report] = transformRouteHandlerSuccessResult(data);

      // Check message
      expect(message).toMatch(/GET \/test 200 in \d+ms/);

      // Check report
      expect(report.request).toMatchObject({
        ...testReport,
        statusCode: 200,
      });

      // Check startTime
      expect(report.request.startTime).toBeTypeOf('number');
      expect(new Date(report.request.startTime)).toBeInstanceOf(Date);
      expect(Number.isNaN(new Date(report.request.startTime).getTime())).toBe(false);

      // Check endTime
      expect(report.request.endTime).toBeTypeOf('number');
      expect(new Date(report.request.endTime)).toBeInstanceOf(Date);
      expect(Number.isNaN(new Date(report.request.endTime).getTime())).toBe(false);
    });

    it('should transform error result correctly', () => {
      const error = new Error('Test error');
      const data = {
        req: mockReq,
        error,
        start: 1000,
        end: 1100,
      };

      const [message, report] = transformRouteHandlerErrorResult(data);

      // Check message
      expect(message).toMatch(/GET \/test 500 in \d+ms/);

      // Check report
      expect(report.request).toMatchObject({
        ...testReport,
        statusCode: 500,
      });

      // Check startTime
      expect(report.request.startTime).toBeTypeOf('number');
      expect(new Date(report.request.startTime)).toBeInstanceOf(Date);
      expect(Number.isNaN(new Date(report.request.startTime).getTime())).toBe(false);

      // Check endTime
      expect(report.request.endTime).toBeTypeOf('number');
      expect(new Date(report.request.endTime)).toBeInstanceOf(Date);
      expect(Number.isNaN(new Date(report.request.endTime).getTime())).toBe(false);
    });
  });
});
