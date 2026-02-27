# Axiom TanStack Start/Router library

The `@axiomhq/tanstack-start` package provides observability utilities for TanStack Router (SPA) and TanStack Start (server request/function middleware).

## Requirements

- Node.js 20 or higher for this package
- TanStack Start may require a newer Node.js version depending on your `@tanstack/react-start` version

## Install

```bash
npm install @axiomhq/js @axiomhq/logging @axiomhq/tanstack-start
```

## TanStack Router (SPA)

```ts
import { Logger, ConsoleTransport } from '@axiomhq/logging';
import { observeTanStackRouter } from '@axiomhq/tanstack-start/router';
import { tanStackRouterFormatters } from '@axiomhq/tanstack-start';

const logger = new Logger({
  transports: [new ConsoleTransport()],
  formatters: tanStackRouterFormatters,
});

const observe = observeTanStackRouter(logger);
const unsubscribe = observe(router);
```

## TanStack Start (request/function middleware)

```ts
import { createMiddleware } from '@tanstack/react-start';
import { Logger, ConsoleTransport } from '@axiomhq/logging';
import {
  createAxiomStartRequestMiddleware,
  createAxiomStartFunctionMiddleware,
  createAxiomStartProxyHandler,
  tanStackStartServerFormatters,
} from '@axiomhq/tanstack-start/start';

const logger = new Logger({
  transports: [new ConsoleTransport()],
  formatters: tanStackStartServerFormatters,
});

export const requestMiddleware = [
  createAxiomStartRequestMiddleware(createMiddleware, logger, {
    include: ['/api/*', '/_server/*'],
    exclude: ['/api/health', '/api/internal/*'],
    shouldLog: (ctx) => ctx.request.method !== 'OPTIONS',
  }),
];
export const functionMiddleware = [
  createAxiomStartFunctionMiddleware(createMiddleware, logger, {
    correlation: true,
  }),
];
```

Set `correlation: true` to add a correlation ID to function calls on the client, forward it to the server (`request_id` context + `x-axiom-correlation-id` header), and align request/function logs.

If you want correlation as a standalone middleware, you can still use `createAxiomStartFunctionCorrelationMiddleware(createMiddleware)`.

## Uncaught Server Errors (Server Entry)

Wrap your `createServerEntry` fetch handler to capture uncaught server-entry errors.

```ts
import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { withAxiomStartErrorCapture } from '@axiomhq/tanstack-start/start';

export default createServerEntry({
  fetch: withAxiomStartErrorCapture(handler.fetch, logger),
});
```

## Proxy API Route Helper

Use this helper in a TanStack Start API route to ingest batched client logs through your server.

```ts
import { createFileRoute } from '@tanstack/react-router';
import { createAxiomStartProxyHandler } from '@axiomhq/tanstack-start/start';

const proxyHandler = createAxiomStartProxyHandler(logger);

export const Route = createFileRoute('/api/axiom')({
  server: {
    handlers: {
      POST: ({ request }) => proxyHandler(request),
    },
  },
});
```

## License

[MIT](../../LICENSE)
