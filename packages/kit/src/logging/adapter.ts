import { LogEvent } from '../logging/logger';

// This is the base class for all environment providers. It contains all the different
// configurations per provider, and the functions that are used by the logger to give more
// context to the ingested events.
// Implement this interface to have special behavior on your platform.
export interface Adapter {
  isEnvVarsSet(): boolean;
  getBrowserRewrites(): any[];
  //   getIngestURL(): string;
  injectMeta(event: LogEvent, req: any): LogEvent;
  transformEvent(event: LogEvent): LogEvent;
  //   wrapWebVitalsObject(metrics: NextWebVitalsMetric[]): any;

  shouldSendEdgeReport(): boolean;
  shouldSendLambdaReport(): boolean;
}
