import js from '@eslint/js';
import globals from 'globals';
import tsdoc from 'eslint-plugin-tsdoc';
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  eslintConfigPrettier,
  {
    plugins: {
      tsdoc,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['**/dist/', '**/node_modules/'],
  },
];
