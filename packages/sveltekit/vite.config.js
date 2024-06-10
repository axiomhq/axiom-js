import { resolve } from 'path';

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dtsPlugin from 'vite-plugin-dts';

console.log({ src: resolve(__dirname, 'src/index.server.ts') });

export default defineConfig({
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.server.ts'),
        resolve(__dirname, 'src/index.client.ts'),
      ],
      //   entry: 'src/index.server.ts',
      name: 'svelte-axiom',
      //   fileName: (format) => `svelte-axiom.${format}.js`,
    },
    rollupOptions: {
      external: ['svelte', '$app/environment'],
      // plugins: [typescript({ outDir: 'dist/', declarationDir: 'dist/types' })],
    },
  },
  plugins: [
    svelte({
      /* plugin options */
    }),
    dtsPlugin({
      outDir: 'dist/types',
      // declarationOnly: true,
    }),
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      enabled: true,
      reportsDirectory: './coverage',
    },
  },
});

// import { sveltekit } from '@sveltejs/kit/vite';
// import { defineConfig } from 'vitest/config';

// export default defineConfig({
// 	plugins: [sveltekit()],
// 	test: {
// 		include: ['src/**/*.{test,spec}.{js,ts}']
// 	}
// });
