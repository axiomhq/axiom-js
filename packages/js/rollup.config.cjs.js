import typescript from '@rollup/plugin-typescript';
import json from "@rollup/plugin-json";

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      preserveModules: true,
      entryFileNames: '[name].cjs',
    },
    plugins: [
      typescript({ outDir: 'dist/cjs', declarationDir: 'dist/cjs/types' }),
      json()
    ],
  },
];
