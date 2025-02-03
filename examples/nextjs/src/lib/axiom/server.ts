import { Logger, AxiomFetchTransport, ConsoleTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, routeHandlerContextFormatter } from '@axiomhq/nextjs';

export const logger = new Logger({
  transports: [
    new AxiomFetchTransport({
      dataset: process.env.AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!,
    }),
    new ConsoleTransport(),
  ],
  formatters: [routeHandlerContextFormatter],
});

export const withAxiom = createAxiomRouteHandler({ logger });
