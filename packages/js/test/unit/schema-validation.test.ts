import { describe, expect, it, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Axiom, AxiomWithoutBatching } from '../../src/client';
import { z } from 'zod';

// Define a test schema using Zod
const LogSchema = z.object({
  level: z.string(),
  message: z.string(),
  userId: z.string().optional(),
});

describe('Schema Validation', () => {
  const server = setupServer(
    http.post('*/v1/datasets/*/ingest', () => {
      return HttpResponse.json({
        ingested: 1,
        failed: 0,
        processedBytes: 100,
        blocksCreated: 1,
        walLength: 0,
      });
    }),
  );

  beforeEach(() => {
    server.listen();
  });

  describe('Axiom (with batching)', () => {
    it('should accept valid events that match the schema', async () => {
      const onError = vi.fn();
      const axiom = new Axiom({
        token: 'test-token',
        schema: LogSchema,
        onError,
      });

      // Valid event
      await axiom.ingest('test-dataset', {
        level: 'info',
        message: 'Test message',
        userId: 'user-123',
      });

      await axiom.flush();

      // Should not call error handler for valid events
      expect(onError).not.toHaveBeenCalled();
    });

    it('should reject invalid events that do not match the schema', async () => {
      const onError = vi.fn();
      const axiom = new Axiom({
        token: 'test-token',
        schema: LogSchema,
        onError,
      });

      // Invalid event (missing message)
      // @ts-expect-error - Should fail type check since message is required
      await axiom.ingest('test-dataset', {
        level: 'info',
        userId: 'user-123',
      });

      await axiom.flush();

      // Should call error handler for invalid events
      expect(onError).toHaveBeenCalled();
      const error = onError.mock.calls[0][0];
      expect(error.message).toContain('Schema validation failed');
    });

    it('should validate multiple events in an array', async () => {
      const onError = vi.fn();
      const axiom = new Axiom({
        token: 'test-token',
        schema: LogSchema,
        onError,
      });

      // Mix of valid and invalid events
      await axiom.ingest('test-dataset', [
        { level: 'info', message: 'Valid event 1' },
        { level: 'warn', message: 'Valid event 2', userId: 'user-123' },
      ]);

      await axiom.flush();

      // Should not call error handler for valid events
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('AxiomWithoutBatching', () => {
    it('should accept valid events that match the schema', async () => {
      const axiom = new AxiomWithoutBatching({
        token: 'test-token',
        schema: LogSchema,
      });

      const result = await axiom.ingest('test-dataset', {
        level: 'info',
        message: 'Test message',
        userId: 'user-123',
      });

      expect(result.ingested).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should reject invalid events and return failed status', async () => {
      const onError = vi.fn();
      const axiom = new AxiomWithoutBatching({
        token: 'test-token',
        schema: LogSchema,
        onError,
      });

      // Invalid event (wrong type for level)
      const result = await axiom.ingest('test-dataset', {
        // @ts-expect-error - Should fail type check since level must be string
        level: 123,
        message: 'Test message',
      });

      expect(result.ingested).toBe(0);
      expect(result.failed).toBe(1);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Without Schema', () => {
    it('should accept any object when no schema is provided', async () => {
      const axiom = new AxiomWithoutBatching({
        token: 'test-token',
        // No schema provided
      });

      // Can ingest any shape
      const result = await axiom.ingest('test-dataset', {
        any: 'field',
        works: true,
        number: 42,
      });

      expect(result.ingested).toBe(1);
      expect(result.failed).toBe(0);
    });
  });
});
