import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  test: {
    setupFiles: ['./test/lib/setupNext.ts'],
    env: {
      __NEXT_EXPERIMENTAL_AUTH_INTERRUPTS: 'true', // Allows for forbidden() and unauthorized() to work
    },
  },
}));
