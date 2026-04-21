# TanStack Start Solid Example

This example demonstrates how to use [`@axiomhq/tanstack-start`](../../packages/tanstack-start) in a Solid-based TanStack Start app.

It covers the shared and framework-specific observability paths:

1. TanStack Router SPA navigation and route timing events (`@axiomhq/tanstack-start/router`)
2. TanStack Start request/function middleware (including client+server correlation via `createAxiomMiddleware(..., { correlation: true })`)
3. Solid route-level error-boundary integration through TanStack Router `defaultErrorComponent` (`@axiomhq/tanstack-start/solid`)

## Run

```bash
pnpm install
pnpm --filter tanstack-start-solid dev
```

The app runs on [http://localhost:3001](http://localhost:3001).

## Optional Axiom Ingestion

By default logs are printed to the console.

To also ingest into Axiom, set these environment variables before starting the app:

- `VITE_AXIOM_TOKEN`
- `VITE_AXIOM_DATASET`

## Important Files

- `src/router.tsx`: router creation + observer wiring + default route error component
- `src/start.ts`: global Start middleware wiring
- `src/lib/logger.ts`: logger/transports setup
- `src/components/RouteErrorComponent.tsx`: TanStack Router default error component using the Solid adapter helper
- `src/styles.css`: example styling for the Solid app shell
