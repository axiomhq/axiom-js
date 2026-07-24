'use client';
import { Logger } from '@axiomhq/logging';
import * as React from 'react';
import { onLCP, onFID, onCLS, onINP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

const SCALAR_ENTRY_PROPERTIES = [
  'name',
  'entryType',
  'startTime',
  'duration',
  'renderTime',
  'loadTime',
  'size',
  'id',
  'url',
  'value',
  'hadRecentInput',
  'lastInputTime',
  'processingStart',
  'processingEnd',
  'interactionId',
  'cancelable',
  'activationStart',
  'workerStart',
  'redirectStart',
  'redirectEnd',
  'fetchStart',
  'domainLookupStart',
  'domainLookupEnd',
  'connectStart',
  'secureConnectionStart',
  'connectEnd',
  'requestStart',
  'responseStart',
  'responseEnd',
  'transferSize',
  'encodedBodySize',
  'decodedBodySize',
  'nextHopProtocol',
  'type',
] as const;

const RECT_PROPERTIES = ['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'] as const;

function readProperty(value: object, property: string): unknown {
  try {
    return (value as Record<string, unknown>)[property];
  } catch {
    return undefined;
  }
}

function normalizeNode(node: unknown): Record<string, string> | undefined {
  if (typeof node !== 'object' || node === null) {
    return undefined;
  }

  const result: Record<string, string> = {};
  for (const property of ['nodeName', 'tagName', 'id', 'className'] as const) {
    const value = readProperty(node, property);
    if (typeof value === 'string' && value.length > 0) {
      result[property] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeRect(rect: unknown): Record<string, number> | undefined {
  if (typeof rect !== 'object' || rect === null) {
    return undefined;
  }

  const result: Record<string, number> = {};
  for (const property of RECT_PROPERTIES) {
    const value = readProperty(rect, property);
    if (typeof value === 'number') {
      result[property] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeLayoutShiftSources(sources: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(sources)) {
    return undefined;
  }

  return sources.map((source) => {
    if (typeof source !== 'object' || source === null) {
      return {};
    }

    return {
      node: normalizeNode(readProperty(source, 'node')),
      previousRect: normalizeRect(readProperty(source, 'previousRect')),
      currentRect: normalizeRect(readProperty(source, 'currentRect')),
    };
  });
}

function normalizePerformanceEntry(entry: PerformanceEntry): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const property of SCALAR_ENTRY_PROPERTIES) {
    const value = readProperty(entry, property);
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[property] = value;
    }
  }

  const element = normalizeNode(readProperty(entry, 'element'));
  if (element !== undefined) {
    result.element = element;
  }

  const target = normalizeNode(readProperty(entry, 'target'));
  if (target !== undefined) {
    result.target = target;
  }

  const sources = normalizeLayoutShiftSources(readProperty(entry, 'sources'));
  if (sources !== undefined) {
    result.sources = sources;
  }

  return result;
}

export function useReportWebVitals(pushMetrics: (metric: Metric) => void, flushMetrics: () => void) {
  const pushMetricsRef = React.useRef(pushMetrics);
  const flushMetricsRef = React.useRef(flushMetrics);

  React.useEffect(() => {
    const effectFlushMetrics = () => {
      flushMetricsRef.current();
    };

    onCLS(pushMetricsRef.current);
    onFID(pushMetricsRef.current);
    onLCP(pushMetricsRef.current);
    onINP(pushMetricsRef.current);
    onFCP(pushMetricsRef.current);
    onTTFB(pushMetricsRef.current);

    document.addEventListener('visibilitychange', effectFlushMetrics);

    return () => {
      document.removeEventListener('visibilitychange', effectFlushMetrics);
    };
  }, []);
}

export const transformWebVitalsMetric = (metric: Metric): Record<string, any> => {
  return {
    webVital: {
      ...metric,
      entries: metric.entries?.map(normalizePerformanceEntry) ?? [],
    },
    _time: new Date().getTime(),
    source: 'web-vital',
    path: window.location.pathname,
  };
};

export const createWebVitalsComponent = (logger: Logger) => {
  const sendMetrics = (metric: Metric) => {
    logger.raw(transformWebVitalsMetric(metric));
  };

  const flushMetrics = () => {
    logger.flush();
  };

  return () => {
    useReportWebVitals(sendMetrics, flushMetrics);

    return <></>;
  };
};
