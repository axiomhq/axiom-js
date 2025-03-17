import { transformOnRequestError, createOnRequestError } from '../../src/instrumentation';
import { describe, expect, it } from 'vitest';
import { InstrumentationOnRequestError } from 'next/dist/server/instrumentation/types';
import { mockLogger } from '../lib/mock';
import { EVENT } from '@axiomhq/logging';

describe('instrumentation', () => {
  const mockRequest: Parameters<InstrumentationOnRequestError>[1] = {
    method: 'GET',
    path: '/test',
    headers: {},
  };
  const mockContext: Parameters<InstrumentationOnRequestError>[2] = {
    routeType: 'render',
    routerKind: 'App Router',
    routePath: '/test',
    revalidateReason: 'on-demand',
    renderSource: 'react-server-components',
  };

  describe('transformOnRequestError', () => {
    it('should transform Error objects correctly', () => {
      const testError = new Error('Test error') as Error & { cause: string; digest: string };
      testError.cause = 'Test cause';
      testError.digest = 'test-digest';

      const [message, report] = transformOnRequestError(testError, mockRequest, mockContext);

      expect(message).toBe('Test error');
      expect(report).toEqual({
        ...testError,
        error: 'Error',
        cause: 'Test cause',
        stack: testError.stack,
        digest: 'test-digest',
        context: mockContext,
        [EVENT]: {
          request: mockRequest,
          source: 'error.tsx',
        },
      });
    });

    it('should transform non-Error objects correctly', () => {
      const testError = 'String error';

      const [message, report] = transformOnRequestError(testError, mockRequest, mockContext);

      expect(message).toBe('GET /test render');
      expect(report).toEqual({
        error: testError,
        context: mockContext,
        [EVENT]: {
          request: mockRequest,
          source: 'error.tsx',
        },
      });
    });
  });

  describe('createOnRequestError', () => {
    it('should create handler that logs errors and flushes', async () => {
      const handler = createOnRequestError(mockLogger);
      const testError = new Error('Test error');

      await handler(testError, mockRequest, mockContext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          error: 'Error',
          context: mockContext,
          [EVENT]: {
            request: mockRequest,
            source: 'error.tsx',
          },
        }),
      );
      expect(mockLogger.flush).toHaveBeenCalledOnce();
    });
  });
});
