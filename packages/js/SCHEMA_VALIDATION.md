# Schema Validation

The Axiom JS SDK now supports schema validation using the [Standard Schema](https://github.com/standard-schema/standard-schema) specification. This allows you to validate your log events before they're ingested into Axiom, ensuring data quality and type safety.

## Supported Schema Libraries

Standard Schema is a universal schema specification that works with multiple validation libraries:

- [Zod](https://github.com/colinhacks/zod) v4+
- [Valibot](https://github.com/fabian-hiller/valibot)
- [ArkType](https://github.com/arktypeio/arktype)
- [Yup](https://github.com/jquense/yup)
- And more...

## Installation

First, install the Axiom SDK and your preferred schema validation library:

```bash
npm install @axiomhq/js zod
# or
pnpm add @axiomhq/js zod
```

## Basic Usage

### With Zod

```typescript
import { Axiom } from '@axiomhq/js';
import { z } from 'zod';

// Define your schema
const LogSchema = z.object({
  level: z.string(),
  message: z.string(),
  userId: z.string().optional(),
});

// Create a typed Axiom client
const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});

// Ingest events with type safety and validation
await logger.ingest('my-dataset', {
  level: 'info',
  message: 'User logged in',
  userId: 'user-123', // ✅ Valid
});

// This would fail validation at runtime:
await logger.ingest('my-dataset', {
  level: 123, // ❌ Type error: should be string
  message: 'Invalid log',
});
```

### With Valibot

```typescript
import { Axiom } from '@axiomhq/js';
import * as v from 'valibot';

const LogSchema = v.object({
  level: v.string(),
  message: v.string(),
  userId: v.optional(v.string()),
});

const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});
```

### With ArkType

```typescript
import { Axiom } from '@axiomhq/js';
import { type } from 'arktype';

const LogSchema = type({
  level: 'string',
  message: 'string',
  'userId?': 'string',
});

const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});
```

## Without Schema (Default Behavior)

If you don't provide a schema, the Axiom client works exactly as before, accepting any object:

```typescript
import { Axiom } from '@axiomhq/js';

const logger = new Axiom({
  token: 'your-axiom-token',
  // No schema provided
});

// Can ingest any object
await logger.ingest('my-dataset', {
  any: 'shape',
  of: 'data',
  works: true,
});
```

## Type Safety

When you provide a schema, TypeScript will infer the correct types for your events:

```typescript
import { Axiom } from '@axiomhq/js';
import { z } from 'zod';

const LogSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});

// TypeScript will ensure you provide the correct shape
await logger.ingest('my-dataset', {
  level: 'info', // ✅ TypeScript autocomplete shows: 'debug' | 'info' | 'warn' | 'error'
  message: 'Hello',
  metadata: { userId: 123 },
});

// TypeScript error: Property 'message' is missing
await logger.ingest('my-dataset', {
  level: 'info',
  // ❌ TypeScript error
});
```

## Error Handling

When schema validation fails, the error is passed to your configured error handler:

```typescript
const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
  onError: (error) => {
    console.error('Failed to ingest logs:', error);
    // Send to your monitoring service, etc.
  },
});

// This will trigger the error handler if validation fails
await logger.ingest('my-dataset', {
  invalid: 'data',
});
```

For the `AxiomWithoutBatching` client, validation errors are returned in the response:

```typescript
import { AxiomWithoutBatching } from '@axiomhq/js';

const logger = new AxiomWithoutBatching({
  token: 'your-axiom-token',
  schema: LogSchema,
});

const result = await logger.ingest('my-dataset', {
  invalid: 'data',
});

if (result.failed > 0) {
  console.log('Validation failed:', result.failures);
}
```

## Batching

Schema validation works seamlessly with the default batching behavior:

```typescript
const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});

// Events are validated before being added to the batch
await logger.ingest('my-dataset', { level: 'info', message: 'Event 1' });
await logger.ingest('my-dataset', { level: 'info', message: 'Event 2' });
await logger.ingest('my-dataset', { level: 'info', message: 'Event 3' });

// Flush all pending events
await logger.flush();
```

## Benefits

1. **Type Safety**: Get full TypeScript support with autocomplete and type checking
2. **Data Quality**: Ensure only valid data is ingested into your datasets
3. **Early Error Detection**: Catch data shape issues before they reach Axiom
4. **Documentation**: Your schema serves as living documentation of your log structure
5. **Flexibility**: Use any standard-schema compatible validation library

## Advanced Usage

### Complex Schemas

```typescript
import { z } from 'zod';

const LogSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  timestamp: z.string().datetime(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'user', 'guest']),
  }),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});
```

### Multiple Datasets with Different Schemas

```typescript
import { Axiom } from '@axiomhq/js';
import { z } from 'zod';

// Create separate loggers for different datasets
const userLogger = new Axiom({
  token: 'your-axiom-token',
  schema: z.object({
    userId: z.string(),
    action: z.string(),
    timestamp: z.string(),
  }),
});

const errorLogger = new Axiom({
  token: 'your-axiom-token',
  schema: z.object({
    error: z.string(),
    stack: z.string(),
    level: z.enum(['error', 'fatal']),
  }),
});

await userLogger.ingest('user-events', {
  userId: '123',
  action: 'login',
  timestamp: new Date().toISOString(),
});

await errorLogger.ingest('errors', {
  error: 'Something went wrong',
  stack: 'Error: ...',
  level: 'error',
});
```

## Migration Guide

If you're already using the Axiom SDK without schemas, no changes are required. The schema parameter is optional, and existing code will continue to work as before:

```typescript
// Before (still works)
const logger = new Axiom({
  token: 'your-axiom-token',
});

// After (with schema validation)
const logger = new Axiom({
  token: 'your-axiom-token',
  schema: LogSchema,
});
```
