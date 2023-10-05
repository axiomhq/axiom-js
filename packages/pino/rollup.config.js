import typescript from '@rollup/plugin-typescript';

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
    plugins: [typescript({ outDir: 'dist/esm', declarationDir: 'dist/esm/types' })],
  },
];
