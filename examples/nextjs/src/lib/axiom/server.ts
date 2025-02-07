import { Logger, AxiomFetchTransport, ConsoleTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, serverContextFieldsFormatter } from '@axiomhq/nextjs';

export const logger = new Logger({
  transports: [
    new AxiomFetchTransport({
      dataset: process.env.AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!,
    }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
  formatters: [serverContextFieldsFormatter],
});

export const withAxiom = createAxiomRouteHandler(logger);
