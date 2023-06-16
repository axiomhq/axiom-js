import { NextWebVitalsMetric } from 'next/app';
import { config } from './core';
import { useLogger } from './hooks';

export declare type WebVitalsMetric = NextWebVitalsMetric & { route: string };

export async function reportWebVitals(metric: NextWebVitalsMetric, path: string) {
  const route = path || window.__NEXT_DATA__?.page;
  // if Axiom env vars are not set, do nothing,
  // otherwise devs will get errors on dev environments
  if (!config.isEnvVarsSet()) {
    return;
  }

  const logger = useLogger();
  // FIXME: find a better way to ingest web-vitals
  logger.client.ingest(config.dataset!, config.wrapWebVitalsObject([{ ...metric, route }]));
  return await logger.flush();
}
