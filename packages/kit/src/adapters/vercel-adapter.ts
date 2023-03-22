import { LogEvent } from '../logging/logger';
import { Adapter } from '../logging/adapter';
import { LoggingSource } from '../logging/config';

const ingestEndpoint = process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT || process.env.AXIOM_INGEST_ENDPOINT || '';
export const enableLogDrain = process.env.ENABLE_AXIOM_LOG_DRAIN == 'true' ? true : false;
const region = process.env.VERCEL_REGION || undefined;
const environment = process.env.VERCEL_ENV || process.env.NODE_ENV;

export class VercelAdapter implements Adapter {
  proxyPath = '/_axiom';
  constructor(public source: LoggingSource, public isWebVitals = false) {}

  isEnvVarsSet(): boolean {
    return ingestEndpoint != undefined && ingestEndpoint != '';
  }

  private getRawIngestURL(eventType: 'web-vitals' | 'logs') {
    const url = new URL(ingestEndpoint);
    url.searchParams.set('type', eventType);
    return url.toString();
  }

  getIngestEndpoint() {
    if (this.source == LoggingSource.browser && this.isWebVitals) {
      return this.isWebVitals ? `${this.proxyPath}/web-vitals` : `${this.proxyPath}/logs`;
    }

    return this.getRawIngestURL('logs');
  }

  getBrowserRewrites() {
    return [
      {
        source: `${this.proxyPath}/web-vitals`,
        // todo: fix this for web-vitals endpoint
        destination: this.getRawIngestURL('web-vitals'),
        basePath: false,
      },
      {
        source: `${this.proxyPath}/logs`,
        destination: this.getRawIngestURL('logs'),
        basePath: false,
      },
    ];
  }

  injectMeta(event: LogEvent, req: any): LogEvent {
    event.vercel = {
      environment: environment,
      region: region,
      source: this.source,
    };

    return event;
  }

  transformEvent(event: LogEvent): LogEvent {
    return event;
  }

  wrapWebVitalsObject(metrics: any[]) {
    return {
      webVitals: metrics,
      environment: environment,
    };
  }

  // edge reports are not automatically sent by vercel
  shouldSendEdgeReport = () => true;
  // lambda report is automatically sent by vercel
  shouldSendLambdaReport = () => false;
}
