import { describe, it, expect, vi, afterAll } from 'vitest';
import { createProxyRouteHandler } from '../../src/proxyRouteHandler';
import { mockLogger } from '../lib/mock';
import { NextRequest } from 'next/server';

describe('createProxyRouteHandler', () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  it('should process log events successfully', async () => {
    const handler = createProxyRouteHandler(mockLogger);
    const mockEvents = [
      { level: 'info', message: 'test1' },
      { level: 'error', message: 'test2' },
    ];

    const req = new NextRequest('http://example.com/test', { method: 'POST', body: JSON.stringify(mockEvents) });
    const response = await handler(req);
    const responseBody = await response.json();

    expect(mockLogger.raw).toHaveBeenCalledTimes(2);
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
    expect(responseBody).toEqual({ status: 'ok' });
  });

  it('should handle errors and return 500 status', async () => {
    const handler = createProxyRouteHandler(mockLogger);
    const req = new NextRequest('http://example.com/test', { method: 'POST' });

    // Mock json() to throw an error
    req.json = () => Promise.reject(new Error('Invalid JSON'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await handler(req);
    const responseBody = await response.json();

    expect(responseBody).toEqual({ status: 'error' });
    expect(response.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
