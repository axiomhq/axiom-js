'use client';
import { Logger } from '@axiomhq/logging';
import * as React from 'react';
import { onLCP, onFID, onCLS, onINP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

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
    webVital: metric,
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
