'use client';

import { Logger, AxiomProxyTransport, ConsoleTransport } from '@axiomhq/logging';
import { createUseLogger, createWebVitalsComponent } from '@axiomhq/react';

export const logger = new Logger({
  transports: [
    new AxiomProxyTransport({ url: process.env.NEXT_PUBLIC_AXIOM_PROXY_URL!, autoFlush: true }),
    new ConsoleTransport(),
  ],
});

const useLogger = createUseLogger(logger);
const WebVitals = createWebVitalsComponent(logger);

export { useLogger, WebVitals };
