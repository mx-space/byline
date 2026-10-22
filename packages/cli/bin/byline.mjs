#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const production = fileURLToPath(
  new URL('../dist/bin/byline.mjs', import.meta.url),
)
const development = fileURLToPath(
  new URL('../src/bin/byline.ts', import.meta.url),
)

if (existsSync(production)) {
  await import(production)
} else if (existsSync(development)) {
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', development, ...process.argv.slice(2)],
    { stdio: 'inherit' },
  )
  process.exit(result.status ?? 1)
} else {
  console.error('byline entry not found; run `pnpm -C packages/cli run build`.')
  process.exit(1)
}
