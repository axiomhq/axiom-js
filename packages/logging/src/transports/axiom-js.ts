import { AxiomClient, AxiomClientWithoutBatching } from '@axiomhq/js';
import { LogLevel, LogLevelValue } from '../logger';
import { Version } from '../runtime';
import { Transport } from './transport';

interface AxiomJSTransportConfig {
  axiom: AxiomClient | AxiomClientWithoutBatching;
  dataset: string;
  logLevel?: LogLevel;
  /**
   * Additional product tokens to append to the X-Axiom-Client header.
   * Use product/version tokens separated by spaces.
   *
   * @example "axiom-react/1.2.3 my-app/4.5.6"
   */
  axiomClient?: string;
}

type AxiomClientLike = {
  appendAxiomClient?: (axiomClient: string) => void;
};

export const axiomClient = `axiom-logging/${Version ?? 'unknown'}`;

export class AxiomJSTransport implements Transport {
  private config: AxiomJSTransportConfig;
  private promises: Promise<any>[] = [];

  constructor(config: AxiomJSTransportConfig) {
    this.config = config;
    this.appendAxiomClient(config.axiomClient ? `${axiomClient} ${config.axiomClient}` : axiomClient);
  }

  appendAxiomClient(axiomClient: string) {
    (this.config.axiom as AxiomClientLike).appendAxiomClient?.(axiomClient);
  }

  log(logs: any[]) {
    const filteredLogs = logs.filter(
      (log) =>
        LogLevelValue[(log.level as LogLevel) ?? LogLevel.info] >= LogLevelValue[this.config.logLevel ?? LogLevel.info],
    );

    if (filteredLogs.length === 0) {
      return;
    }

    if (this.config.axiom instanceof AxiomClient) {
      this.config.axiom.ingest(this.config.dataset, filteredLogs);
    } else if (this.config.axiom instanceof AxiomClientWithoutBatching) {
      this.promises.push(this.config.axiom.ingest(this.config.dataset, filteredLogs));
    }
  }

  async flush() {
    if (this.config.axiom instanceof AxiomClient) {
      await this.config.axiom.flush();
    } else {
      await Promise.allSettled(this.promises);
    }
    this.promises = [];
  }
}
