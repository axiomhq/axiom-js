# Axiom React library

The `@axiomhq/react` package allows you to send data from a React app to Axiom.

```ts
// lib/axiom/client.ts
'use client';

import axiomClient from '@/lib/axiom/axiom';
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';
import { createUseLogger, createWebVitalsComponent } from '@axiomhq/react';

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({ axiom: axiomClient, dataset: process.env.AXIOM_DATASET! }),
    new ConsoleTransport(),
  ],
});

const useLogger = createUseLogger(logger);
const WebVitals = createWebVitalsComponent(logger);

export { useLogger, WebVitals };
```

## Requirements

Node.js 20 or higher is required. Node.js 18 is no longer supported.

## Install

```bash
npm install @axiomhq/js @axiomhq/logging @axiomhq/react
```

## Documentation

For more information about how to set up and use the `@axiomhq/react` package, see the [axiom.co/docs/send-data/react](https://axiom.co/docs/send-data/react).

## License

[MIT](../../LICENSE)
