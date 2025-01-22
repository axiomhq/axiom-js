import { Logger, AxiomProxyTransport, ConsoleTransport } from '@axiomhq/logging';
import { createClientSideHelpers } from '@axiomhq/react';

export const logger = new Logger({
  transports: [
    new AxiomProxyTransport({ url: process.env.NEXT_PUBLIC_AXIOM_PROXY_URL!, autoFlush: true }),
    new ConsoleTransport(),
  ],
});

export const { useLogger } = createClientSideHelpers(logger);
