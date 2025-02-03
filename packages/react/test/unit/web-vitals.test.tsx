import * as React from 'react';
import { renderHook, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebVitals, { useReportWebVitals } from '../../src/web-vitals';
import { Logger } from '@axiomhq/logging';
import * as webVitals from 'web-vitals';

// Mock all web-vitals functions
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFID: vi.fn(),
  onLCP: vi.fn(),
  onINP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('Web Vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/test-path' },
      writable: true,
    });
  });

  describe('useReportWebVitals', () => {
    it('should register all web vitals metrics', () => {
      const reportFn = vi.fn();
      renderHook(() => useReportWebVitals(reportFn));

      expect(webVitals.onCLS).toHaveBeenCalled();
      expect(webVitals.onFID).toHaveBeenCalled();
      expect(webVitals.onLCP).toHaveBeenCalled();
      expect(webVitals.onINP).toHaveBeenCalled();
      expect(webVitals.onFCP).toHaveBeenCalled();
      expect(webVitals.onTTFB).toHaveBeenCalled();
    });

    it('should pass the report function to all web vitals', () => {
      const reportFn = vi.fn();
      renderHook(() => useReportWebVitals(reportFn));

      const calls = [
        webVitals.onCLS,
        webVitals.onFID,
        webVitals.onLCP,
        webVitals.onINP,
        webVitals.onFCP,
        webVitals.onTTFB,
      ];

      calls.forEach((call) => {
        expect(call).toHaveBeenCalledWith(expect.any(Function));
      });
    });
  });

  describe('createWebVitalsComponent', () => {
    it('should create a component that uses web vitals reporting', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      render(<WebVitals logger={mockLogger} />);

      // Verify that all web vitals are registered
      expect(webVitals.onCLS).toHaveBeenCalled();
      expect(webVitals.onFID).toHaveBeenCalled();
      expect(webVitals.onLCP).toHaveBeenCalled();
      expect(webVitals.onINP).toHaveBeenCalled();
      expect(webVitals.onFCP).toHaveBeenCalled();
      expect(webVitals.onTTFB).toHaveBeenCalled();
    });

    it('should log and flush metrics when reported', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      render(<WebVitals logger={mockLogger} />);

      // Simulate a web vital metric being reported
      const mockMetric = {
        name: 'CLS',
        value: 0.1,
        id: 'test',
      };

      // Get the callback passed to onCLS and call it
      const onCLSCallback = vi.mocked(webVitals.onCLS).mock.calls[0][0] as Function;
      onCLSCallback(mockMetric);

      // Verify the metric was logged and flushed
      expect(mockLogger.raw).toHaveBeenCalledWith({
        webVital: mockMetric,
        _time: expect.any(Number),
        source: 'web-vital',
        path: '/test-path',
      });
      expect(mockLogger.flush).toHaveBeenCalled();
    });

    it('should render an empty fragment', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      const { container } = render(<WebVitals logger={mockLogger} />);

      expect(container.firstChild).toBeNull();
    });

    it('should only be called once mounted and ignore re-renders', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      const { rerender } = render(<WebVitals logger={mockLogger} />);

      rerender(<WebVitals logger={mockLogger} />);

      expect(webVitals.onCLS).toHaveBeenCalledTimes(1);
    });
  });
});
