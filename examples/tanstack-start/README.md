# TanStack Start Example

This example demonstrates how to use [`@axiomhq/tanstack-start`](../../packages/tanstack-start) in a TanStack Start app.

It covers both observability paths:

1. TanStack Router SPA navigation events (`observeTanStackRouter`)
2. TanStack Start request/function middleware (including client+server correlation via `createAxiomStartFunctionMiddleware(..., { correlation: true })`)
3. TanStack Start API route handlers (`server.handlers` on file routes, e.g. `GET /api/time`)

## Run

```bash
pnpm install
pnpm --filter tanstack-start dev
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
- `src/routes/index.tsx`: server function call demo
- `src/routes/api/time.ts`: API route demo (`GET /api/time`)
