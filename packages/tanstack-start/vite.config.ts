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
    entry: ['./src/index.ts', './src/router.ts', './src/start.ts'],
    srcDir: './src',
    cjs: false,
  }),
);
