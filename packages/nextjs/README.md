# Axiom Next.js library

The `@axiomhq/nextjs` package allows you to send data from a Next.js app to Axiom.

```ts
// lib/axiom/server.ts
import axiomClient from '@/lib/axiom/axiom';
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs';

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({ axiom: axiomClient, dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET! }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
  formatters: nextJsFormatters,
});

export const withAxiom = createAxiomRouteHandler(logger);
```

```ts
// api/route.ts
import { withAxiom } from '@/lib/axiom/server';

export const GET = withAxiom(async () => {
  logger.info('Hello World!');
  return new Response('Hello World!');
});
```

## Install

```bash
npm install @axiomhq/js @axiomhq/logging @axiomhq/nextjs @axiomhq/react
```

## Documentation

For more information about how to set up and use the `@axiomhq/nextjs` package, see the [axiom.co/docs/send-data/nextjs](https://axiom.co/docs/send-data/nextjs).

## License

[MIT](../../LICENSE)
