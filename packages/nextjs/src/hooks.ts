import { useReportWebVitals as useNextReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';
import { Logger, LoggerConfig, config } from './core';
import { reportWebVitals } from './webVitals';

export function useReportWebVitals() {
  const path = usePathname();
  useNextReportWebVitals((metric) => reportWebVitals(metric, path));
}

export const parentLogger: Logger = new Logger({}, {
  token: config.token,
  url: config.axiomUrl,
});


export function useLogger(config: LoggerConfig = {}): Logger {
  const isServerSide = typeof window === 'undefined';

  config.source = config.source || isServerSide ? 'RSC' : 'frontend';

  return parentLogger.with(config); // FIXME: Provide request data and source
}
