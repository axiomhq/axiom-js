import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/initial-path',
  },
  writable: true,
});

// Mock history pushState
window.history.pushState = vi.fn();
