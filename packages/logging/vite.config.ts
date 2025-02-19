import { defineConfig, mergeConfig } from 'vite';
import { tanstackViteConfig } from '@tanstack/config/vite';

const config = defineConfig({
  define: {
    __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
  }),
);
