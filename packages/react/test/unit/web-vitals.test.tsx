import * as React from 'react';
import { renderHook, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReportWebVitals, createWebVitalsComponent, transformWebVitalsMetric } from '../../src/web-vitals';
import { Logger } from '@axiomhq/logging';
import * as webVitals from 'web-vitals';
import { Metric } from 'web-vitals';

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
    it('should register all web vitals metrics and visibility change listener', () => {
      const reportFn = vi.fn();
      const flushFn = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useReportWebVitals(reportFn, flushFn));

      expect(webVitals.onCLS).toHaveBeenCalled();
      expect(webVitals.onFID).toHaveBeenCalled();
      expect(webVitals.onLCP).toHaveBeenCalled();
      expect(webVitals.onINP).toHaveBeenCalled();
      expect(webVitals.onFCP).toHaveBeenCalled();
      expect(webVitals.onTTFB).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('should cleanup visibility change listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = renderHook(() => useReportWebVitals(vi.fn(), vi.fn()));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('should call flush metrics when visibility changes', () => {
      const flushFn = vi.fn();
      renderHook(() => useReportWebVitals(vi.fn(), flushFn));

      document.dispatchEvent(new Event('visibilitychange'));

      expect(flushFn).toHaveBeenCalled();
    });
  });

  describe('transformWebVitalsMetric', () => {
    it('should transform web vital metric to expected format', () => {
      const mockMetric = {
        name: 'CLS',
        value: 0.1,
        id: 'test',
      };
      const now = 1234567890;
      vi.spyOn(Date.prototype, 'getTime').mockReturnValue(now);

      const result = transformWebVitalsMetric(mockMetric as Metric);

      expect(result).toEqual({
        webVital: mockMetric,
        _time: now,
        source: 'web-vital',
        path: '/test-path',
      });
    });
  });

  describe('createWebVitalsComponent', () => {
    it('should create a component that uses web vitals reporting', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      const WebVitals = createWebVitalsComponent(mockLogger);
      render(<WebVitals />);

      expect(webVitals.onCLS).toHaveBeenCalled();
      expect(webVitals.onFID).toHaveBeenCalled();
      expect(webVitals.onLCP).toHaveBeenCalled();
      expect(webVitals.onINP).toHaveBeenCalled();
      expect(webVitals.onFCP).toHaveBeenCalled();
      expect(webVitals.onTTFB).toHaveBeenCalled();
    });

    it('should log transformed metrics and flush when reported', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;
      const WebVitals = createWebVitalsComponent(mockLogger);
      const now = 1234567890;
      vi.spyOn(Date.prototype, 'getTime').mockReturnValue(now);

      render(<WebVitals />);

      const mockMetric = {
        name: 'CLS',
        value: 0.1,
        id: 'test',
      };

      const onCLSCallback = vi.mocked(webVitals.onCLS).mock.calls[0][0] as Function;
      onCLSCallback(mockMetric);

      expect(mockLogger.raw).toHaveBeenCalledWith({
        webVital: mockMetric,
        _time: now,
        source: 'web-vital',
        path: '/test-path',
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockLogger.flush).toHaveBeenCalled();
    });

    it('should render an empty fragment', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      const WebVitals = createWebVitalsComponent(mockLogger);
      const { container } = render(<WebVitals />);

      expect(container.firstChild).toBeNull();
    });

    it('should only be called once mounted and ignore re-renders', () => {
      const mockLogger = {
        raw: vi.fn(),
        flush: vi.fn(),
      } as unknown as Logger;

      const WebVitals = createWebVitalsComponent(mockLogger);
      const { rerender } = render(<WebVitals />);

      rerender(<WebVitals />);

      expect(webVitals.onCLS).toHaveBeenCalledTimes(1);
    });
  });
});
