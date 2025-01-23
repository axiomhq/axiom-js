import { config } from '@repo/eslint-config/base';

export default [
  ...config,
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
