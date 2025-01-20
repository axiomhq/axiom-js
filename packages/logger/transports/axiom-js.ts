import type { Axiom } from "@axiomhq/js";

export class AxiomJSTransport {
  private axiom: Axiom;
  private dataset: string;

  constructor(axiom: Axiom, dataset: string) {
    this.axiom = axiom;
    this.dataset = dataset;
  }

  log(logs: any[]) {
    this.axiom.ingest(this.dataset, logs);
  }

  async flush() {
    await this.axiom.flush();
  }
}
