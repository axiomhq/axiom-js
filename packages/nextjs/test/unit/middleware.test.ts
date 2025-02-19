import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { transformMiddlewareRequest } from '../../src/middleware';

describe('transformMiddlewareRequest', () => {
  it('should transform a basic request correctly', () => {
    const mockRequest = new NextRequest('https://example.com/test', {
      headers: {
        Referer: 'https://previous-page.com',
        'user-agent': 'Mozilla/5.0',
      },
    });

    Object.defineProperty(mockRequest, 'ip', { value: '127.0.0.1' });
    Object.defineProperty(mockRequest, 'geo', { value: { region: 'CA' } });

    const [message, report] = transformMiddlewareRequest(mockRequest);

    expect(message).toBe('GET /test');
    expect(report).toEqual({
      request: {
        ip: '127.0.0.1',
        region: 'CA',
        method: 'GET',
        host: 'example.com',
        path: '/test',
        scheme: 'https',
        referer: 'https://previous-page.com',
        userAgent: 'Mozilla/5.0',
      },
    });
  });

  it('should handle missing optional fields', () => {
    const mockRequest = new NextRequest('http://example.com/api/data', {
      method: 'POST',
    });

    const [message, report] = transformMiddlewareRequest(mockRequest);

    expect(message).toBe('POST /api/data');
    expect(report).toEqual({
      request: {
        ip: undefined,
        region: undefined,
        method: 'POST',
        host: 'example.com',
        path: '/api/data',
        scheme: 'http',
        referer: null,
        userAgent: null,
      },
    });
  });

  it('should handle different HTTP methods and paths', () => {
    const mockRequest = new NextRequest('https://api.example.com/users/123', {
      method: 'DELETE',
    });

    const [message, report] = transformMiddlewareRequest(mockRequest);

    expect(message).toBe('DELETE /users/123');
    expect(report.request.method).toBe('DELETE');
    expect(report.request.path).toBe('/users/123');
  });
});
