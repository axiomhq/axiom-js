import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import solid from 'vite-plugin-solid'
import { tanstackStart } from '@tanstack/solid-start/plugin/vite'

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart(),
    solid(),
  ],
})
