# Axiom JavaScript SDK

The Axiom JavaScript SDK allows you to send data from a JavaScript app to Axiom.

```ts
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN,
});

axiom.ingest('DATASET_NAME', [{ foo: 'bar' }]);
await axiom.flush();
```

## Install

```bash
npm install @axiomhq/js
```

## Features

- **Batched Ingestion**: Events are queued and sent in the background every second or every 1000 events
- **Type-Safe**: Full TypeScript support with type inference
- **Schema Validation**: Optional runtime validation using Zod, Valibot, ArkType, or any standard-schema compatible library
- **Flexible**: Works in Node.js and browsers

## Schema Validation

The SDK supports optional schema validation using the [Standard Schema](https://github.com/standard-schema/standard-schema) specification. This provides type safety and runtime validation for your events:

```ts
import { Axiom } from '@axiomhq/js';
import { z } from 'zod';

const LogSchema = z.object({
  level: z.string(),
  message: z.string(),
  userId: z.string().optional(),
});

const logger = new Axiom({
  token: process.env.AXIOM_TOKEN,
  schema: LogSchema, // Events are now validated and type-safe
});

// TypeScript knows the shape of your events
await logger.ingest('logs', {
  level: 'info',
  message: 'User logged in',
  userId: 'user-123',
});
```

For more details, see [SCHEMA_VALIDATION.md](./SCHEMA_VALIDATION.md).

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/guides/javascript](https://axiom.co/docs/guides/javascript).

## License

[MIT](../../LICENSE)
