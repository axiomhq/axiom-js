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
        rating: 'good',
        delta: 0.1,
        id: 'test',
        navigationType: 'navigate',
        entries: [],
      } satisfies Metric;
      const now = 1234567890;
      vi.spyOn(Date.prototype, 'getTime').mockReturnValue(now);

      const result = transformWebVitalsMetric(mockMetric);

      expect(result).toEqual({
        webVital: {
          ...mockMetric,
          entries: [],
        },
        _time: now,
        source: 'web-vital',
        path: '/test-path',
      });
    });

    it('should normalize LCP entries without retaining DOM elements', () => {
      const element: Record<string, unknown> = {
        nodeName: 'IMG',
        tagName: 'IMG',
        id: 'hero',
        className: 'hero-image',
      };
      element.reactFiber = { stateNode: element };
      const metric = {
        name: 'LCP',
        value: 2400,
        entries: [
          {
            name: '',
            entryType: 'largest-contentful-paint',
            startTime: 2400,
            duration: 0,
            renderTime: 2400,
            loadTime: 2100,
            size: 120000,
            url: 'https://example.com/hero.jpg',
            element,
          },
        ],
      } as unknown as Metric;

      const result = transformWebVitalsMetric(metric);

      expect(result.webVital.entries).toEqual([
        {
          name: '',
          entryType: 'largest-contentful-paint',
          startTime: 2400,
          duration: 0,
          renderTime: 2400,
          loadTime: 2100,
          size: 120000,
          url: 'https://example.com/hero.jpg',
          element: {
            nodeName: 'IMG',
            tagName: 'IMG',
            id: 'hero',
            className: 'hero-image',
          },
        },
      ]);
      expect(() => JSON.stringify(result)).not.toThrow();
    });

    it('should normalize layout shift sources', () => {
      const metric = {
        name: 'CLS',
        value: 0.1,
        entries: [
          {
            name: '',
            entryType: 'layout-shift',
            startTime: 100,
            duration: 0,
            value: 0.1,
            hadRecentInput: false,
            sources: [
              {
                node: { nodeName: 'DIV', tagName: 'DIV', id: 'content' },
                previousRect: { x: 0, y: 0, width: 100, height: 20 },
                currentRect: { x: 0, y: 20, width: 100, height: 20 },
              },
            ],
          },
        ],
      } as unknown as Metric;

      const result = transformWebVitalsMetric(metric);

      expect(result.webVital.entries[0]).toMatchObject({
        entryType: 'layout-shift',
        value: 0.1,
        hadRecentInput: false,
        sources: [
          {
            node: { nodeName: 'DIV', tagName: 'DIV', id: 'content' },
            previousRect: { x: 0, y: 0, width: 100, height: 20 },
            currentRect: { x: 0, y: 20, width: 100, height: 20 },
          },
        ],
      });
    });

    it('should preserve navigation timing diagnostics', () => {
      const metric = {
        name: 'TTFB',
        value: 350,
        entries: [
          {
            name: 'https://example.com/',
            entryType: 'navigation',
            startTime: 0,
            duration: 800,
            fetchStart: 5,
            domainLookupStart: 10,
            domainLookupEnd: 20,
            connectStart: 20,
            secureConnectionStart: 25,
            connectEnd: 40,
            requestStart: 45,
            responseStart: 350,
            responseEnd: 500,
            transferSize: 2048,
            nextHopProtocol: 'h2',
          },
        ],
      } as unknown as Metric;

      const result = transformWebVitalsMetric(metric);

      expect(result.webVital.entries[0]).toMatchObject({
        entryType: 'navigation',
        requestStart: 45,
        responseStart: 350,
        responseEnd: 500,
        transferSize: 2048,
        nextHopProtocol: 'h2',
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
        entries: [],
      };

      const onCLSCallback = vi.mocked(webVitals.onCLS).mock.calls[0][0] as Function;
      onCLSCallback(mockMetric);

      expect(mockLogger.raw).toHaveBeenCalledWith({
        webVital: {
          ...mockMetric,
          entries: [],
        },
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
