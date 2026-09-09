# Axiom Logging library

The `@axiomhq/logging` package allows you to send structured logs to Axiom from any JavaScript application.

```ts
// lib/axiom/logger.ts
import axiomClient from '@/lib/axiom/axiom';
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.AXIOM_DATASET!,
      axiomClient: 'my-app/1.0',
    }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
});

logger.info('Hello World!');
```

`AxiomJSTransport` appends logging package usage to the Axiom client's `X-Axiom-Client` header. With the example above, requests use an `X-Axiom-Client` header like `axiom-js/<version> axiom-logging/<version> my-app/1.0`.

## Proxy transport delivery

`ProxyTransport` uses `SimpleFetchTransport` to send logs to your HTTP endpoint. Delivery is best effort:

- The transport retains at most 1,000 queued events plus one batch of at most 1,000 events in flight. When the queue fills, it drops the oldest queued events to retain recent activity. The in-flight batch is unchanged. These limits bound event counts, not bytes or individual event sizes.
- With `autoFlush: true`, the first queued event starts a two-second timer. Later events do not postpone it, and a full queue starts a send immediately when no batch is in flight. `{ durationMs }` sets a different delay. With `autoFlush` omitted or `false`, sending starts only when you call `flush()`.
- Requests run one at a time. Network failures and HTTP 429, 500, 502, 503, and 504 receive at most one retry after a one-second delay. A longer `Retry-After` is honored. Both attempts and their delays share a ten-second deadline.
- Permanent failures, caller cancellation, timeout, or an exhausted retry drop the batch. If `Retry-After` cannot fit within the deadline, the batch is dropped without retrying early. Subsequent batches also respect that server cooldown and are dropped if they cannot wait within their own deadline.
- Drops produce `console.warn` diagnostics containing counts by reason, without log contents. Warnings are emitted at most once every 30 seconds per transport; suppressed counts are included in the next warning when more drops occur.

`flush()` waits for events accepted before that call to be sent or dropped. Later events do not extend that caller's target, and concurrent calls share the serial sender. A resolved flush does not guarantee delivery. Retrying after a lost response can duplicate events that the server already accepted.

Earlier versions retained failed batches for a later flush. The bounded retry policy above replaces that behavior, so a prolonged outage can cause data loss without allowing the backlog to grow indefinitely.

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
