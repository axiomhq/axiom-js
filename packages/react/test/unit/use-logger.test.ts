import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUseLogger } from '../../src/use-logger';
import { Logger } from '@axiomhq/logging';

describe('Logger hook', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      flush: vi.fn(),
    } as unknown as Logger;

    // Reset window.location.pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/initial-path' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUseLogger', () => {
    it('should return a hook function', () => {
      const mockLogger = {} as Logger;
      const useLogger = createUseLogger(mockLogger);

      expect(typeof useLogger).toBe('function');
    });

    it('should throw if no logger is provided', () => {
      const logger = undefined as unknown as Logger;

      expect(() => createUseLogger(logger)).toThrow('A logger must be provided to create useLogger');
    });

    it('should accept a valid logger instance', () => {
      const mockLogger = {
        flush: () => Promise.resolve(),
        info: () => {},
        error: () => {},
      } as unknown as Logger;

      expect(() => createUseLogger(mockLogger)).not.toThrow();
    });
  });

  describe('useLogger', () => {
    it('should return the logger instance', () => {
      const useLogger = createUseLogger(mockLogger);
      const { result } = renderHook(() => useLogger());

      expect(result.current).toBe(mockLogger);
    });

    it('should call logger.flush when path changes', async () => {
      const useLogger = createUseLogger(mockLogger);
      const { unmount } = renderHook(() => useLogger());

      // Simulate path change
      act(() => {
        window.dispatchEvent(new Event('popstate'));
      });

      unmount();
      expect(mockLogger.flush).toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const useLogger = createUseLogger(mockLogger);
      const { unmount } = renderHook(() => useLogger());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pushState', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('replaceState', expect.any(Function));
    });
  });
});
