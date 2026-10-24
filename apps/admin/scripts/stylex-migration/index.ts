// Ported from lobe-chat scripts/stylexMigration/index.ts.
//   pnpm stylex:migration                 tier totals and the busiest areas
//   pnpm stylex:migration --list <tier>   files in one tier
//   pnpm stylex:migration --json          full per-file report
//   pnpm stylex:migration --prune-legacy  drop migrated files from legacyFiles.json
//   pnpm stylex:migration --codemod [--tier A,B] [--path <prefix>]… [--dry]
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { classifySource, type StyleFileReport } from './classify'
import { runCodemod, summarizeSkips } from './codemod'

const adminRoot = path.resolve(import.meta.dirname, '../..')
export const legacyFilesPath = path.join(
  import.meta.dirname,
  'legacyFiles.json',
)

export type FileReport = StyleFileReport & { area: string; file: string }

const areaOf = (file: string) => file.split('/').slice(0, 3).join('/')

export const scanAdmin = (root = adminRoot): FileReport[] => {
  const files = execFileSync(
    'git',
    ['ls-files', '--', 'src/*.ts', 'src/*.tsx'],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  )
    .split('\n')
    .filter(Boolean)

  const reports: FileReport[] = []
  for (const file of files) {
    let source: string
    try {
      source = readFileSync(path.join(root, file), 'utf8')
    } catch {
      continue
    }
    if (!source.includes('@lobehub/ui')) continue
    const report = classifySource(source)
    if (report.legacyImports.length === 0) continue
    reports.push({ ...report, area: areaOf(file), file })
  }
  return reports
}

export const readLegacyFiles = (): string[] =>
  JSON.parse(readFileSync(legacyFilesPath, 'utf8')) as string[]

export const findStaleLegacyFiles = (
  reports: FileReport[],
  legacy = readLegacyFiles(),
) => {
  const current = new Set(reports.map((r) => r.file))
  return legacy.filter((file) => !current.has(file))
}

const writeLegacyFiles = (files: string[]) =>
  writeFileSync(
    legacyFilesPath,
    `${JSON.stringify([...files].sort(), null, 2)}\n`,
  )

const printSummary = (reports: FileReport[]) => {
  const tiers = { A: 0, B: 0, C: 0, D: 0 }
  const areas = new Map<string, typeof tiers & { total: number }>()
  for (const r of reports) {
    tiers[r.tier]++
    const area = areas.get(r.area) ?? { A: 0, B: 0, C: 0, D: 0, total: 0 }
    area[r.tier]++
    area.total++
    areas.set(r.area, area)
  }
  console.log(
    `${reports.length} files on emotion styles — A ${tiers.A} · B ${tiers.B} · C ${tiers.C} · D ${tiers.D}`,
  )
  console.log('\narea | A | B | C | D | total')
  for (const [area, t] of [...areas].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`${area} | ${t.A} | ${t.B} | ${t.C} | ${t.D} | ${t.total}`)
  }
}

const optionValues = (args: string[], flag: string) =>
  args.flatMap((arg, i) => (arg === flag && args[i + 1] ? [args[i + 1]] : []))

const codemod = async (args: string[], reports: FileReport[]) => {
  const tiers = new Set((optionValues(args, '--tier')[0] ?? 'A,B').split(','))
  const prefixes = optionValues(args, '--path')
  const files = reports
    .filter((r) => tiers.has(r.tier))
    .filter(
      (r) =>
        prefixes.length === 0 || prefixes.some((p) => r.file.startsWith(p)),
    )
    .map((r) => r.file)

  const report = await runCodemod(adminRoot, files, {
    write: !args.includes('--dry'),
  })
  console.log(
    `converted ${report.converted.length} / ${files.length}, skipped ${report.skipped.length}`,
  )
  for (const [reason, count] of summarizeSkips(report.skipped))
    console.log(`  ${count}\t${reason}`)
  if (report.review.length > 0) {
    console.log(
      '\nreview — cx() merges StyleX classes with an outside className:',
    )
    for (const file of report.review) console.log(`  ${file}`)
  }
  if (args.includes('--verbose')) {
    console.log('\nskipped:')
    for (const { file, reason } of report.skipped)
      console.log(`  ${file}: ${reason}`)
  }
}

const main = async () => {
  const args = process.argv.slice(2)
  const reports = scanAdmin()

  if (args.includes('--json')) {
    console.log(JSON.stringify(reports, null, 2))
    return
  }

  const listIndex = args.indexOf('--list')
  if (listIndex !== -1) {
    const tier = args[listIndex + 1]
    for (const r of reports.filter((item) => item.tier === tier))
      console.log(r.file)
    return
  }

  if (args.includes('--codemod')) {
    await codemod(args, reports)
    return
  }

  if (args.includes('--prune-legacy')) {
    const legacy = readLegacyFiles()
    const stale = new Set(findStaleLegacyFiles(reports, legacy))
    writeLegacyFiles(legacy.filter((file) => !stale.has(file)))
    console.log(`pruned ${stale.size} migrated files from legacyFiles.json`)
    return
  }

  printSummary(reports)
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
