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
- `createAxiomFnMiddleware`
- `createAxiomFnCorrelationMiddleware`
- `createAxiomProxyHandler`
- `createAxiomUncaughtErrorHandler`
- `captureError`
- `getLogLevelFromStatusCode`
- `getStartErrorStatusCode`
- `transformStartRequestSuccessResult`
- `transformStartRequestErrorResult`
- `transformStartFunctionSuccessResult`
- `transformStartFunctionErrorResult`
- `tanStackStartServerFormatters`
- `tanStackStartClientFormatters`

```ts
import {
  createAxiomFnMiddleware,
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

TanStack Start helpers that receive a logger append `axiom-tanstack-start/<version>` to supported logging transports' `X-Axiom-Client` header.

## Shared Start Middleware

The Start middleware APIs are framework-neutral because they build on TanStack Start core contracts.

```ts
import {
  createAxiomFnMiddleware,
  createAxiomRequestMiddleware,
} from '@axiomhq/tanstack-start';

export const requestMiddleware = [
  createAxiomRequestMiddleware(startLogger, {
    include: ['/api/*', '/_server/*'],
    exclude: ['/api/health'],
  }),
];

export const functionMiddleware = [
  createAxiomFnMiddleware(startLogger, {
    correlation: true,
  }),
];
```

Request and function middleware currently await `logger.flush()` before resolving. When we want non-blocking delivery later, the clean path is to introduce an injected `waitUntil`-style primitive instead of expanding the public config surface.

Use one function instrumentation path per server function. If `createAxiomFnMiddleware` is mounted globally through `createStart({ functionMiddleware })`, do not also attach it to individual server functions unless you intentionally want multiple log events for the same call.

To fully customize emitted fields or side effects, provide `onSuccess` / `onError` callbacks. When a callback is provided, the middleware skips default logging for that path. The `transformStart*Result` helpers are exported for users who want to keep the default message/report shape and add their own fields.

```ts
import {
  createAxiomRequestMiddleware,
  getLogLevelFromStatusCode,
  getStartErrorStatusCode,
  transformStartRequestErrorResult,
  transformStartRequestSuccessResult,
} from '@axiomhq/tanstack-start';

export const requestMiddleware = [
  createAxiomRequestMiddleware(startLogger, {
    onSuccess: async (data) => {
      const [message, report] = transformStartRequestSuccessResult(data);
      const logLevel = getLogLevelFromStatusCode(data.response.status);

      startLogger.log(logLevel, message, {
        ...report,
        tenant: data.request.headers.get('x-tenant-id'),
        region: data.request.headers.get('x-region'),
      });

      await startLogger.flush();
    },
    onError: async (data) => {
      const [message, report] = transformStartRequestErrorResult(data);
      const logLevel = getLogLevelFromStatusCode(getStartErrorStatusCode(data.error));

      startLogger.log(logLevel, message, {
        ...report,
        tenant: data.request.headers.get('x-tenant-id'),
        region: data.request.headers.get('x-region'),
      });

      await startLogger.flush();
    },
  }),
];
```

```ts
import {
  createAxiomFnMiddleware,
  transformStartFunctionErrorResult,
  transformStartFunctionSuccessResult,
} from '@axiomhq/tanstack-start';

export const functionMiddleware = [
  createAxiomFnMiddleware(startLogger, {
    correlation: true,
    onSuccess: async (data) => {
      const [message, report] = transformStartFunctionSuccessResult(data);

      startLogger.info(message, {
        ...report,
        requestHeaders: {
          tenant: data.context.context?.request?.headers.get('x-tenant-id'),
          region: data.context.context?.request?.headers.get('x-region'),
        },
      });

      await startLogger.flush();
    },
    onError: async (data) => {
      const [message, report] = transformStartFunctionErrorResult(data);

      startLogger.error(message, {
        ...report,
        requestHeaders: {
          tenant: data.context.context?.request?.headers.get('x-tenant-id'),
          region: data.context.context?.request?.headers.get('x-region'),
        },
      });

      await startLogger.flush();
    },
  }),
];
```

For simple side effects, callbacks can ignore logging entirely:

```ts
createAxiomRequestMiddleware(startLogger, {
  onSuccess: async (data) => {
    await analytics.track('request_complete', {
      path: new URL(data.request.url).pathname,
      statusCode: data.response.status,
    });
  },
});
```

## Router Observer

```ts
import { observeTanStackRouter } from '@axiomhq/tanstack-start/router';

const observe = observeTanStackRouter(routerLogger, {
  source: 'tanstack-router-spa',
  performance: true,
});

const unsubscribe = observe(router);
```

`observeTanStackRouter` listens to `onResolved` by default. It only subscribes in the browser, so it is safe to call from router setup that also runs during SSR. The returned `unsubscribe` function can be used by HMR or custom router lifecycles.

Use the default `source` of `tanstack-router` for general Router instrumentation, or set a custom source such as `tanstack-router-spa`, `tanstack-router-react`, or `tanstack-router-solid` when you want to distinguish app/framework variants in Axiom.

When `performance` is enabled, the observer pairs router lifecycle events and emits route timing logs in addition to navigation logs.

## Client-Side Proxy Ingestion

For browser logs, use `ProxyTransport` on the client and receive those events with `createAxiomProxyHandler` on the server. This keeps the Axiom token server-side while preserving the same logger API in client code.

```ts
// src/lib/axiom/client.ts
import { ConsoleTransport, Logger, ProxyTransport } from '@axiomhq/logging';
import type { Transport } from '@axiomhq/logging';
import { tanStackStartClientFormatters } from '@axiomhq/tanstack-start';
import { tanStackRouterFormatters } from '@axiomhq/tanstack-start/router';

function createBrowserTransports(): [Transport, ...Transport[]] {
  return [
    new ProxyTransport({ url: '/api/axiom' }),
    new ConsoleTransport({ prettyPrint: true }),
  ];
}

export const routerLogger = new Logger({
  transports: createBrowserTransports(),
  formatters: tanStackRouterFormatters,
});

export const clientLogger = new Logger({
  transports: createBrowserTransports(),
  formatters: tanStackStartClientFormatters,
});
```

```ts
// src/lib/axiom/server.ts
import { Axiom } from '@axiomhq/js';
import { AxiomJSTransport, ConsoleTransport, Logger } from '@axiomhq/logging';
import { tanStackStartServerFormatters } from '@axiomhq/tanstack-start';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN! });

export const startLogger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom,
      dataset: process.env.AXIOM_DATASET!,
    }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
  formatters: tanStackStartServerFormatters,
});
```

```ts
// src/routes/api/axiom.ts
import { createFileRoute } from '@tanstack/react-router';
import { createAxiomProxyHandler } from '@axiomhq/tanstack-start';
import { startLogger } from '../../lib/axiom/server';

const proxyHandler = createAxiomProxyHandler(startLogger);

export const Route = createFileRoute('/api/axiom')({
  server: {
    handlers: {
      POST: ({ request }) => proxyHandler(request),
    },
  },
});
```

For Solid apps, use the same route pattern with `createFileRoute` from `@tanstack/solid-router`.

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
