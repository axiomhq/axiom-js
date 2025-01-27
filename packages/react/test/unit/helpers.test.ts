import { describe, it, expect } from 'vitest';
import { createClientSideHelpers } from '../../src/helpers';
import { Logger } from '@axiomhq/logging';

describe('createClientSideHelpers', () => {
  it('should throw an error if no logger is provided', () => {
    expect(() => createClientSideHelpers(undefined as unknown as Logger)).toThrow(
      'A logger must be provided to create client side helpers',
    );
  });

  it('should return an object with useLogger function', () => {
    const mockLogger = {} as Logger;
    const helpers = createClientSideHelpers(mockLogger);

    expect(helpers).toHaveProperty('useLogger');
    expect(typeof helpers.useLogger).toBe('function');
  });
});
