import { defineConfig } from '@lobehub/eslint-config'

import { stylexMigrationConfig } from './apps/admin/scripts/stylex-migration/eslint.mjs'

export default defineConfig(
  {
    ignores: [
      'node_modules',
      'dist',
      'out',
      'packages/*/node_modules',
      'packages/*/dist',
      'packages/*/out',
      'packages/*/lib',
      'packages/*/build',
      'packages/*/coverage',
      'packages/*/test',
      'packages/*/tests',
      'packages/*/esm',
      'packages/*/types',
      'test/**/*.db.ts',
      '.agents/**',
    ],
    sortKeys: false,
    typescript: true,
    react: false,
    reactCompiler: false,
  },
  {
    languageOptions: {
      parserOptions: {
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
    },
    rules: {
      eqeqeq: 'off',
      'no-void': 0,
      '@typescript-eslint/consistent-type-assertions': 0,
      'no-restricted-syntax': 0,
      'unicorn/filename-case': 0,
      'unicorn/prefer-math-trunc': 0,
      'unicorn/prefer-single-call': 0,

      'unused-imports/no-unused-imports': 'error',

      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'require-await': 0,
      '@typescript-eslint/no-unsafe-function-type': 0,
      'unicorn/no-array-callback-reference': 0,

      'unicorn/no-thenable': 0,
      'no-duplicate-imports': 'off',
      'unicorn/explicit-length-check': 0,
      'unicorn/prefer-top-level-await': 0,
      'unicorn/no-array-push-push': 0,
      '@typescript-eslint/no-require-imports': 0,
      'perfectionist/sort-imports': 0,
      'unicorn/import-style': 0,
      'unicorn/text-encoding-identifier-case': 0,
      'unicorn/number-literal-case': 0,
    },
  },
  {
    files: ['packages/*api-client/**/*.ts'],
    rules: { 'unused-imports/no-unused-vars': 0 },
  },
  {
    files: ['apps/admin/**/*.{ts,tsx}'],
    rules: { 'unicorn/better-regex': 0 },
  },
  {
    files: ['apps/server/test/**/*.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  ...stylexMigrationConfig,
)
