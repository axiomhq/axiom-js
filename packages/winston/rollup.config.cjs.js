import typescript from '@rollup/plugin-typescript';

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
    plugins: [typescript({ outDir: 'dist/cjs', declarationDir: 'dist/cjs/types' })],
  },
];
