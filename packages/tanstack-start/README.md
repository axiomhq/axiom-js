# Axiom TanStack Start/Router library

The `@axiomhq/tanstack-start` package provides observability utilities for TanStack Router (SPA) and TanStack Start (server request/function middleware).

## Requirements

- Node.js 20 or higher for this package
- TanStack Start may require a newer Node.js version depending on your `@tanstack/react-start` version

## Install

```bash
npm install @axiomhq/js @axiomhq/logging @axiomhq/tanstack-start
```

## Suggested File Layout

Use this structure in your app:

- `src/lib/axiom/logger.ts`: logger instances and transports
- `src/router.tsx`: TanStack Router creation + SPA observer
- `src/start.ts`: TanStack Start middleware wiring
- `src/routes/api/axiom.ts`: optional proxy ingestion route
- `src/entry-server.ts` or server-entry file: uncaught server-entry capture

## Logger Setup

```ts
import { Logger, ConsoleTransport } from '@axiomhq/logging';
import { tanStackRouterFormatters, tanStackStartServerFormatters } from '@axiomhq/tanstack-start';

export const routerLogger = new Logger({
  transports: [new ConsoleTransport()],
  formatters: tanStackRouterFormatters,
});

export const startLogger = new Logger({
  transports: [new ConsoleTransport()],
  formatters: tanStackStartServerFormatters,
});
```

## TanStack Router (SPA)

```ts
import { observeTanStackRouter } from '@axiomhq/tanstack-start';
import { routerLogger } from '@/lib/axiom/logger';

const observe = observeTanStackRouter(routerLogger, {
  eventType: 'onResolved',
  source: 'tanstack-router-spa',
});

const unsubscribe = observe(router);
```

## TanStack Start (request/function middleware)

```ts
import { createMiddleware } from '@tanstack/react-start';
import {
  createAxiomRequestMiddleware,
  createAxiomMiddleware,
} from '@axiomhq/tanstack-start';
import { startLogger } from '@/lib/axiom/logger';

export const requestMiddleware = [
  createAxiomRequestMiddleware(createMiddleware, startLogger, {
    include: ['/api/*', '/_server/*'],
    exclude: ['/api/health', '/api/internal/*'],
    shouldLog: (ctx) => ctx.request.method !== 'OPTIONS',
  }),
];
export const functionMiddleware = [
  createAxiomMiddleware(createMiddleware, startLogger, {
    correlation: true,
  }),
];
```

Set `correlation: true` to add a correlation ID to function calls on the client, forward it to the server (`request_id` context + `x-axiom-correlation-id` header), and align request/function logs.

If you want correlation as a standalone middleware, use `createAxiomFunctionCorrelationMiddleware(createMiddleware)`.

## Uncaught Server Errors (Server Entry)

Wrap your `createServerEntry` fetch handler to capture uncaught server-entry errors.

```ts
import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { captureError } from '@axiomhq/tanstack-start';
import { startLogger } from '@/lib/axiom/logger';

export default createServerEntry({
  fetch: captureError(handler.fetch, startLogger),
});
```

## Proxy API Route Helper

Use this helper in a TanStack Start API route to ingest batched client logs through your server.

```ts
import { createFileRoute } from '@tanstack/react-router';
import { createAxiomProxyHandler } from '@axiomhq/tanstack-start';
import { startLogger } from '@/lib/axiom/logger';

const proxyHandler = createAxiomProxyHandler(startLogger);

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
