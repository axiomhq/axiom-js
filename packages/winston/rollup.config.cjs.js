import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

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
      replace({
        preventAssignment: true,
        AXIOM_VERSION: process.env.npm_package_version,
      }),
    ],
  },
];
