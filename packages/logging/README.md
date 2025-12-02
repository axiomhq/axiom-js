# Axiom Logging library

The `@axiomhq/logging` package allows you to send structured logs to Axiom from any JavaScript application.

```ts
// lib/axiom/logger.ts
import axiomClient from '@/lib/axiom/axiom';
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({ axiom: axiomClient, dataset: process.env.AXIOM_DATASET! }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
});

logger.info('Hello World!');
```

## Requirements

Node.js 20 or higher is required. Node.js 18 is no longer supported.

## Install

```bash
npm install @axiomhq/js @axiomhq/logging
```

## Documentation

For more information about how to set up and use the `@axiomhq/logging` package, see the [axiom.co/docs/guides/javascript](https://axiom.co/docs/guides/javascript).

## License

[MIT](../../LICENSE)
