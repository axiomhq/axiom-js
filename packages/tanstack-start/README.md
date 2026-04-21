# Axiom TanStack Start

The `@axiomhq/tanstack-start` package provides observability helpers for TanStack Start applications across React and Solid.

## Install

```bash
npm install @axiomhq/js @axiomhq/logging @axiomhq/tanstack-start
```

## Package Surface

### Root: shared TanStack Start core

Use the root package for framework-neutral Start observability:

- `createAxiomRequestMiddleware`
- `createAxiomMiddleware`
- `createAxiomFunctionCorrelationMiddleware`
- `createAxiomProxyHandler`
- `createAxiomUncaughtErrorHandler`
- `captureError`
- `tanStackStartServerFormatters`
- `tanStackStartClientFormatters`

```ts
import { createMiddleware } from '@tanstack/react-start';
import {
  createAxiomMiddleware,
  createAxiomRequestMiddleware,
  tanStackStartServerFormatters,
} from '@axiomhq/tanstack-start';
```

### `@axiomhq/tanstack-start/router`

Use the explicit router subpath for TanStack Router navigation and timing helpers:

- `observeTanStackRouter`
- `tanStackRouterFormatters`

```ts
import { observeTanStackRouter, tanStackRouterFormatters } from '@axiomhq/tanstack-start/router';
```

### `@axiomhq/tanstack-start/react`

Use the React adapter to report errors from TanStack Router `defaultErrorComponent`, per-route `errorComponent`, or broader app-level boundaries:

```ts
import { createAxiomReactErrorHandler } from '@axiomhq/tanstack-start/react';
```

### `@axiomhq/tanstack-start/solid`

Use the Solid adapter to report errors from TanStack Router `defaultErrorComponent`, per-route `errorComponent`, or broader app-level boundaries:

```ts
import { createAxiomSolidErrorHandler } from '@axiomhq/tanstack-start/solid';
```

## Logger Setup

```ts
import { Logger, ConsoleTransport } from '@axiomhq/logging';
import { tanStackStartServerFormatters } from '@axiomhq/tanstack-start';
import { tanStackRouterFormatters } from '@axiomhq/tanstack-start/router';

export const routerLogger = new Logger({
  transports: [new ConsoleTransport()],
  formatters: tanStackRouterFormatters,
});

export const startLogger = new Logger({
  transports: [new ConsoleTransport()],
  formatters: tanStackStartServerFormatters,
});
```

## Shared Start Middleware

The Start middleware APIs are framework-neutral because they build on TanStack Start core contracts.

```ts
import { createMiddleware } from '@tanstack/react-start';
import {
  createAxiomMiddleware,
  createAxiomRequestMiddleware,
} from '@axiomhq/tanstack-start';

export const requestMiddleware = [
  createAxiomRequestMiddleware(createMiddleware, startLogger, {
    include: ['/api/*', '/_server/*'],
    exclude: ['/api/health'],
  }),
];

export const functionMiddleware = [
  createAxiomMiddleware(createMiddleware, startLogger, {
    correlation: true,
  }),
];
```

Request and function middleware currently await `logger.flush()` before resolving. When we want non-blocking delivery later, the clean path is to introduce an injected `waitUntil`-style primitive instead of expanding the public config surface.

## Router Observer

```ts
import { observeTanStackRouter } from '@axiomhq/tanstack-start/router';

const observe = observeTanStackRouter(routerLogger, {
  eventType: 'onResolved',
  source: 'tanstack-router-spa',
  performance: true,
});

const unsubscribe = observe(router);
```

When `performance` is enabled, the observer pairs router lifecycle events and emits route timing logs in addition to navigation logs.

## Client Error Boundaries

TanStack Start's built-in pattern is to catch route render and loader errors with TanStack Router `defaultErrorComponent` or route `errorComponent`. The adapters below are designed to plug into that boundary model first.

### React

```ts
import { ErrorComponent, createRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect } from 'react';
import { createAxiomReactErrorHandler } from '@axiomhq/tanstack-start/react';

const handleClientError = createAxiomReactErrorHandler(startLogger);

function RouterErrorBoundary({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    handleClientError(error);
  }, [error]);

  return <ErrorComponent error={error} />;
}

const router = createRouter({
  routeTree,
  defaultErrorComponent: RouterErrorBoundary,
});
```

### Solid

```tsx
import { ErrorComponent, createRouter, type ErrorComponentProps } from '@tanstack/solid-router';
import { onMount } from 'solid-js';
import { createAxiomSolidErrorHandler } from '@axiomhq/tanstack-start/solid';

const handleClientError = createAxiomSolidErrorHandler(startLogger);

function RouterErrorBoundary(props: ErrorComponentProps) {
  onMount(() => handleClientError(props.error, props.reset));
  return <ErrorComponent error={props.error} />;
}

const router = createRouter({
  routeTree,
  defaultErrorComponent: RouterErrorBoundary,
});
```

If you also want to catch client errors outside TanStack Router route boundaries, you can still use the same adapter helpers from a broader framework-level boundary.

## Observability Coverage

SDK-backed:

- request middleware
- server-function middleware
- request/function correlation
- router navigation logs
- router timing logs
- proxy ingestion
- uncaught server-entry capture
- React and Solid client error-boundary helpers

App-pattern only:

- health checks
- debug headers
- environment-specific logging policies

## Examples

- React: [`examples/tanstack-start`](../../examples/tanstack-start)
- Solid: [`examples/tanstack-start-solid`](../../examples/tanstack-start-solid)

## Migration Note

Router instrumentation is now intentionally explicit. Import router helpers from `@axiomhq/tanstack-start/router` instead of the root package.

## License

[MIT](../../LICENSE)
