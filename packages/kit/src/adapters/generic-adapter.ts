import { LogEvent } from '../logging/logger';
import { isBrowser } from '../platform';
import { Adapter } from '../logging/adapter';
import { LoggingSource } from '../logging/config';

const axiomUrl = process.env.AXIOM_URL || 'https://api.axiom.co';
const dataset = process.env.AXIOM_DATASET;
const token = process.env.AXIOM_TOKEN;
const region = process.env.REGION || undefined;
const environment: string = process.env.NODE_ENV || 'dev';

const ingestEndpoint = `${axiomUrl}/v1/ingest/${dataset}`;
export const enableLogDrain = process.env.ENABLE_AXIOM_LOG_DRAIN == 'true' ? true : false;
const netlifySiteId = process.env.SITE_ID;
const netlifyBuildId = process.env.BUILD_ID;
const netlifyContext = process.env.CONTEXT;
const netlifyDeploymentUrl = process.env.DEPLOYMENT_URL;
const netlifyDeploymentId = process.env.DEPLOYMENT_ID;

export class GenericAdapter implements Adapter {
  proxyPath = '/_axiom';
  constructor(public source: LoggingSource) {}

  isEnvVarsSet(): boolean {
    return !!(dataset && token);
  }

  getIngestEndpoint() {
    if (isBrowser()) {
      return `/${this.proxyPath}/logs`;
    }

    return ingestEndpoint;
  }

  getBrowserRewrites() {
    return [
      {
        source: `${this.proxyPath}/logs`,
        destination: ingestEndpoint,
        basePath: false,
      },
    ];
  }

  injectMeta(event: LogEvent, req: any): LogEvent {
    event.platform = {
      environment: environment,
      region: region,
      source: this.source + '-log',
    };

    return event;
  }

  transformEvent(event: LogEvent): LogEvent {
    return event;
  }

  wrapWebVitalsObject(metrics: any[]) {
    return metrics.map((m) => ({
      webVital: m,
      _time: new Date().getTime(),
      netlify: {
        environment: environment,
        source: 'browser',
        siteId: netlifySiteId,
        buildId: netlifyBuildId,
        context: netlifyContext,
        deploymentUrl: netlifyDeploymentUrl,
        deploymentId: netlifyDeploymentId,
      },
    }));
  }

  shouldSendEdgeReport = () => true;
  shouldSendLambdaReport = () => true;
}

export interface NetlifyInfo {
  buildId?: string;
  context?: string;
  deploymentUrl?: string;
  deploymentId?: string;
  siteId?: string;
}
