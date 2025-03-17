import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const config = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/lib/setupNext.ts'],
    env: {
      __NEXT_EXPERIMENTAL_AUTH_INTERRUPTS: 'true', // Allows for forbidden() and unauthorized() to work
    },
  },
});

export default mergeConfig(viteConfig, config);
