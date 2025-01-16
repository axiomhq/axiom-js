import { Logger } from '@axiomhq/logger';
import { AxiomProxyTransport, ConsoleTransport } from '@axiomhq/logger/transports';
import { createClientSideHelpers } from '@axiomhq/react';

export const logger = new Logger({
  transports: [new AxiomProxyTransport({ url: process.env.NEXT_PUBLIC_AXIOM_PROXY_URL! }), new ConsoleTransport()],
});

export const { useLogger } = createClientSideHelpers(logger);
