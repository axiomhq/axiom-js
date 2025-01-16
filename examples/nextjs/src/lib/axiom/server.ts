import { Logger } from '@axiomhq/logger';
import { AxiomFetchTransport, ConsoleTransport } from '@axiomhq/logger/transports';

export const logger = new Logger({
  transports: [
    new AxiomFetchTransport({
      dataset: process.env.AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!,
    }),
    new ConsoleTransport(),
  ],
});
