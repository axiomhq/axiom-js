export const Version = require('../package.json').version;

export default class ConfigProvider {
  token = process.env.AXIOM_TOKEN;
  dataset = process.env.AXIOM_DATASET;
  environment: string = process.env.NODE_ENV || 'dev';
  axiomUrl = process.env.AXIOM_URL || 'https://api.axiom.co';
  region = process.env.REGION || undefined;

  isEnvVarsSet(): boolean {
    return !!(this.axiomUrl && this.dataset && this.token);
  }

  getIngestURL(): string {
    return `${this.axiomUrl}/api/v1/datasets/${this.dataset}/ingest`;
  }

  wrapWebVitalsObject(metrics: any[]): any {
    return metrics.map(m => ({
      webVital: m,
      _time: new Date().getTime(),
      platform: {
        environment: this.environment,
        source: 'web-vital',
      },
    }))
  }
}

export const config = new ConfigProvider();
