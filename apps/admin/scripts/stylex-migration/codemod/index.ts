// Ported from lobe-chat scripts/stylexMigration/codemod/index.ts.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { UnsupportedCssError } from './css'
import { transformSource } from './transform'
import { compileStylex, format, lintAndFix } from './validate'

export interface CodemodReport {
  converted: string[]
  review: string[]
  skipped: { file: string; reason: string }[]
}

const SOURCE_EXTENSIONS = ['.tsx', '.ts', '/index.tsx', '/index.ts']

const grepFiles = (root: string, pattern: string, globs: string[]) => {
  try {
    return execFileSync('git', ['grep', '-l', pattern, '--', ...globs], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
  } catch (error) {
    // git grep exits 1 when nothing matches.
    if ((error as { status?: number }).status === 1) return []
    throw error
  }
}

export const findFilesWithMockedStyles = (root: string) => {
  const tests = grepFiles(root, 'createStaticStyles:', [
    '*.test.ts',
    '*.test.tsx',
  ])
  const files = new Set<string>()
  for (const test of tests) {
    const source = readFileSync(path.join(root, test), 'utf8')
    for (const [, spec] of source.matchAll(/from ['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const base = path.join(path.dirname(test), spec)
      const hit = ['', ...SOURCE_EXTENSIONS]
        .map((ext) => base + ext)
        .find((f) => existsSync(path.join(root, f)) && /\.tsx?$/.test(f))
      if (hit) files.add(path.normalize(hit))
    }
  }
  return files
}

export const findUncompiledTestConfig = (root: string, file: string) => {
  for (
    let dir = path.dirname(file);
    dir !== '.' && dir !== '';
    dir = path.dirname(dir)
  ) {
    for (const name of [
      'vitest.config.mts',
      'vitest.config.ts',
      'vitest.config.mjs',
    ]) {
      const config = path.join(dir, name)
      if (!existsSync(path.join(root, config))) continue
      return readFileSync(path.join(root, config), 'utf8').includes(
        'stylexPlugin',
      )
        ? undefined
        : config
    }
  }
}

export const runCodemod = async (
  root: string,
  files: string[],
  { write = true }: { write?: boolean } = {},
): Promise<CodemodReport> => {
  const report: CodemodReport = { converted: [], review: [], skipped: [] }
  const mocked = findFilesWithMockedStyles(root)

  for (const file of files) {
    const filePath = path.join(root, file)
    if (mocked.has(file)) {
      report.skipped.push({ file, reason: 'tests mock createStaticStyles' })
      continue
    }
    const uncompiled = findUncompiledTestConfig(root, file)
    if (uncompiled) {
      report.skipped.push({ file, reason: `${uncompiled} lacks stylexPlugin` })
      continue
    }
    const source = readFileSync(filePath, 'utf8')
    try {
      const { code, mergesOutsideClassName } = transformSource(source, file)
      compileStylex(code, filePath)
      const linted = await lintAndFix(await format(code, filePath), filePath)
      if (linted.errors.length > 0)
        throw new UnsupportedCssError(`lint: ${linted.errors[0]}`)
      // eslint --fix merges duplicate imports without formatting them.
      if (write) writeFileSync(filePath, await format(linted.code, filePath))
      report.converted.push(file)
      if (mergesOutsideClassName > 0) report.review.push(file)
    } catch (error) {
      const reason =
        error instanceof UnsupportedCssError
          ? error.message
          : `compile: ${(error as Error).message.split('\n')[0].replace(`${filePath}: `, '')}`
      report.skipped.push({ file, reason })
    }
  }
  return report
}

export const summarizeSkips = (skipped: CodemodReport['skipped']) => {
  const counts = new Map<string, number>()
  for (const { reason } of skipped) {
    const key = reason
      .replace(
        /^(selector|interpolation|style entry|cx argument|factory uses) .*/,
        '$1 …',
      )
      .replace(/^(cx: outside class after StyleX): .*/, '$1')
      .replace(/^(lint: [^:]+):.*/, '$1')
      .replace(
        /^packages\/.+ lacks stylexPlugin$/,
        'package vitest config lacks stylexPlugin',
      )
      .replace(/^(compile: ).*/, '$1…')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1])
}
