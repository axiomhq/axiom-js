'use client';
import { Logger } from '@axiomhq/logging';
import * as React from 'react';
import { onLCP, onFID, onCLS, onINP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

export function useReportWebVitals(reportWebVitalsFn: (metric: Metric) => void) {
  const ref = React.useRef(reportWebVitalsFn);

  ref.current = reportWebVitalsFn;

  React.useEffect(() => {
    onCLS(ref.current);
    onFID(ref.current);
    onLCP(ref.current);
    onINP(ref.current);
    onFCP(ref.current);
    onTTFB(ref.current);
  }, []);
}

const transformWebVitalsMetric = (metric: Metric): Record<string, any> => {
  return {
    webVital: metric,
    _time: new Date().getTime(),
    source: 'web-vital',
    path: window.location.pathname,
  };
};

export const createWebVitalsComponent = (logger: Logger) => {
  const reportWebVitals = (metric: Metric) => {
    logger.raw(transformWebVitalsMetric(metric));
    logger.flush();
  };

  return () => {
    useReportWebVitals(reportWebVitals);

    return <></>;
  };
};
