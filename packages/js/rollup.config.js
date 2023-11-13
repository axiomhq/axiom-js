import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import json from "@rollup/plugin-json";

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      exports: 'named',
      sourcemap: true,
      preserveModules: true,
    },
    plugins: [
      typescript({ outDir: 'dist/esm', declarationDir: 'dist/esm/types' }),
      json(),
      replace({
        AXIOM_VERSION: process.env.npm_package_version,
      }),
    ],
  },
];
