# TanStack Start React Example

This example demonstrates how to use [`@axiomhq/tanstack-start`](../../packages/tanstack-start) in a React-based TanStack Start app.

It covers both observability paths:

1. TanStack Router SPA navigation and route timing events (`@axiomhq/tanstack-start/router`)
2. TanStack Start request/function middleware (including client+server correlation via `createAxiomMiddleware(..., { correlation: true })`)
3. React route-level error-boundary integration through TanStack Router `defaultErrorComponent` (`@axiomhq/tanstack-start/react`)
4. TanStack Start API route handlers (`server.handlers` on file routes, e.g. `GET /api/time`)

## Run

```bash
pnpm install
pnpm --filter tanstack-start-react dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Optional Axiom Ingestion

By default logs are printed to the console.

To also ingest into Axiom, create `.env` from `.env.example` and set:

- `VITE_AXIOM_TOKEN`
- `VITE_AXIOM_DATASET`

## Important Files

- `src/router.tsx`: router creation + SPA observer wiring
- `src/start.ts`: global Start middleware wiring
- `src/lib/logger.ts`: logger/transports setup
- `src/routes/index.tsx`: server function call + route error demo
- `src/components/RouteErrorComponent.tsx`: TanStack Router default error component using the adapter helper
- `src/routes/api/time.ts`: API route demo (`GET /api/time`)
