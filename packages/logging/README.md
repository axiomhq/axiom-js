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

## Schema validation

`Logger` can validate and type log `fields` using any validator that implements Standard Schema v1 (for example `zod`).

```ts
import { z } from 'zod';
import { Logger, ConsoleTransport } from '@axiomhq/logging';

const LogFieldsSchema = z
  .object({
    userId: z.string(),
    action: z.enum(['login', 'logout']),
  })
  .strict();

const logger = new Logger({
  transports: [new ConsoleTransport()],
  schema: LogFieldsSchema,
  onValidationError: (context) => {
    console.warn('Dropped invalid log', context.stage, context.reason, context.issues);
  },
});

logger.info('User action', { userId: '123', action: 'login' });
```

Invalid logs are dropped before transport delivery. `schema` validates input `fields` before formatters run, and `outputSchema` can validate the final formatted event:

```ts
const OutputSchema = z.object({
  eventName: z.string(),
  userId: z.string(),
});

const logger = new Logger({
  transports: [new ConsoleTransport()],
  schema: LogFieldsSchema,
  outputSchema: OutputSchema,
  formatters: [
    (event) => ({
      eventName: event.message,
      userId: event.fields.userId,
    }),
  ],
});
```

Unknown key behavior depends on your schema configuration:
- strict object schemas (like `z.object(...).strict()`) reject unknown keys
- non-strict schemas may allow them

`logger.raw(...)` bypasses schema validation.

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
