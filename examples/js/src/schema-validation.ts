import { Axiom } from '@axiomhq/js';
import { z } from 'zod';

// Define a schema using Zod
const LogSchema = z.object({
  level: z.string(),
  message: z.string(),
  userId: z.string().optional(),
});

// Create an Axiom client with the schema
const logger = new Axiom({
  token: process.env.AXIOM_TOKEN || 'xaat-test-token',
  schema: LogSchema,
});

// Example 1: Valid log entries (these will pass validation)
async function validLogs() {
  console.log('Testing valid log entries...');

  await logger.ingest('my-dataset', {
    level: 'info',
    message: 'User logged in',
    userId: 'user-123',
  });

  await logger.ingest('my-dataset', [
    { level: 'debug', message: 'Debug message' },
    { level: 'error', message: 'Error occurred', userId: 'user-456' },
  ]);

  console.log('Valid logs ingested successfully!');
}

// Example 2: Invalid log entries (these will fail validation)
async function invalidLogs() {
  console.log('Testing invalid log entries...');

  try {
    // Missing required 'message' field - will fail validation
    // @ts-expect-error - Testing validation error
    await logger.ingest('my-dataset', {
      level: 'info',
      userId: 'user-123',
    });
  } catch (error) {
    console.log('Caught validation error:', error);
  }

  try {
    // Wrong type for 'level' - will fail validation
    await logger.ingest('my-dataset', {
      // @ts-expect-error - Testing validation error
      level: 123, // should be string
      message: 'Test message',
    });
  } catch (error) {
    console.log('Caught validation error:', error);
  }
}

// Example 3: Using Axiom without schema (type-safe for any object)
async function noSchemaValidation() {
  console.log('Testing without schema validation...');

  const loggerNoSchema = new Axiom({
    token: process.env.AXIOM_TOKEN || 'xaat-test-token',
  });

  // Can ingest any object shape
  await loggerNoSchema.ingest('my-dataset', {
    any: 'field',
    works: true,
    number: 42,
  });

  console.log('Logs without schema ingested successfully!');
}

// Run examples
async function main() {
  await validLogs();
  await invalidLogs();
  await noSchemaValidation();

  // Flush all pending events
  await logger.flush();
}

main().catch(console.error);
