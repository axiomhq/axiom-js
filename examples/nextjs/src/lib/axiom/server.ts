import axiomClient from '@/lib/axiom/axiom';
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, serverContextFieldsFormatter, frameworkIdentifier } from '@axiomhq/nextjs';

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({ axiom: axiomClient, dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET! }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
  formatters: [serverContextFieldsFormatter],
  frameworkIdentifier,
});

export const withAxiom = createAxiomRouteHandler(logger);
