import { Logger } from '@axiomhq/logging';
import { vi } from 'vitest';

export const mockLogger = {
  raw: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  with: vi.fn(),
  flush: vi.fn(),
} as unknown as Logger;
