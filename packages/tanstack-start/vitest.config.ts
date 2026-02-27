import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const config = defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});

export default mergeConfig(viteConfig, config);
