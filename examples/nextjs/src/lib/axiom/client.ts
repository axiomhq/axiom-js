'use client';

import { Logger, ProxyTransport, ConsoleTransport } from '@axiomhq/logging';
import { createUseLogger, createWebVitalsComponent } from '@axiomhq/react';

export const logger = new Logger({
  transports: [
    new ProxyTransport({ url: process.env.NEXT_PUBLIC_AXIOM_PROXY_URL!, autoFlush: true }),
    new ConsoleTransport(),
  ],
});

const useLogger = createUseLogger(logger);
const WebVitals = createWebVitalsComponent(logger);

export { useLogger, WebVitals };
