// Ported from lobe-chat scripts/stylexMigration/eslint.mjs.
import { readFileSync } from 'node:fs'

import stylex from '@stylexjs/eslint-plugin'
import { builtinRules } from 'eslint/use-at-your-own-risk'

const readJson = (file) =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))

const ADMIN = 'apps/admin/'
const legacyImports = readJson('./legacyImports.json')
// Route segments such as `(content)` and `[id]` would otherwise be read as glob
// groups and character classes.
const legacyFiles = readJson('./legacyFiles.json').map(
  (file) => ADMIN + file.replaceAll(/[!()*+?@[\]{}]/g, String.raw`\$&`),
)

// The core no-restricted-imports rule is re-registered under its own name so it
// cannot override, or be overridden by, other no-restricted-imports configs.
export const stylexMigrationConfig = [
  {
    files: [`${ADMIN}src/**/*.{ts,tsx}`],
    ignores: [
      ...legacyFiles,
      `${ADMIN}**/*.test.{ts,tsx}`,
      `${ADMIN}**/__tests__/**`,
    ],
    plugins: {
      'stylex-migration': {
        rules: {
          'no-emotion-styles': builtinRules.get('no-restricted-imports'),
        },
      },
    },
    rules: {
      'stylex-migration/no-emotion-styles': [
        'error',
        {
          paths: [
            {
              allowTypeImports: true,
              importNames: legacyImports,
              message:
                'Admin styles are moving to StyleX. Use stylex.create with @lobehub/ui/stylex/cssVar.stylex (see .agents/ux/components.md).',
              name: '@lobehub/ui',
            },
          ],
        },
      ],
    },
  },
  {
    files: [`${ADMIN}src/**/*.{ts,tsx}`],
    plugins: { '@stylexjs': stylex },
    rules: {
      '@stylexjs/enforce-extension': 'error',
      '@stylexjs/no-conflicting-props': 'error',
      '@stylexjs/no-legacy-contextual-styles': 'error',
      '@stylexjs/no-lookahead-selectors': 'error',
      '@stylexjs/no-unused': 'error',
      '@stylexjs/valid-shorthands': 'error',
      '@stylexjs/valid-styles': 'error',
    },
  },
]
