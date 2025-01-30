import { Axiom, AxiomWithoutBatching } from '@axiomhq/js';
import { LogLevel } from '../logger';
import { Transport } from './transport';

interface AxiomJSTransportConfig {
  axiom: Axiom | AxiomWithoutBatching;
  dataset: string;
  logLevel?: LogLevel;
}
export class AxiomJSTransport implements Transport {
  private config: AxiomJSTransportConfig;
  private promises: Promise<any>[] = [];

  constructor(config: AxiomJSTransportConfig) {
    this.config = config;
  }

  log(logs: any[]) {
    const filteredLogs = logs.filter(
      (log) =>
        (LogLevel[log.level as keyof typeof LogLevel] ?? LogLevel.info) >= (this.config.logLevel ?? LogLevel.info),
    );

    if (filteredLogs.length === 0) {
      return;
    }

    if (this.config.axiom instanceof Axiom) {
      this.config.axiom.ingest(this.config.dataset, filteredLogs);
    } else if (this.config.axiom instanceof AxiomWithoutBatching) {
      this.promises.push(this.config.axiom.ingest(this.config.dataset, filteredLogs));
    }
  }

  async flush() {
    if (this.config.axiom instanceof Axiom) {
      await this.config.axiom.flush();
    } else {
      await Promise.allSettled(this.promises);
    }
  }
}
