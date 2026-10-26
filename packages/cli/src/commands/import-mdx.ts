import { parseArgs } from 'node:util'

import { createClient } from '@mx-space/byline-api-client'

import { readCredentials, resolveApiCredentials } from '../auth/credentials'
import { fetchSession } from '../auth/device'
import { loadImportConfig } from '../importer/config'
import { executeImport, type PostOutcome } from '../importer/execute'
import { planImport } from '../importer/plan'
import { formatSummary, summarize } from '../importer/report'
import type { UnknownComponentPolicy } from '../mdx/component-map'

export const IMPORT_MDX_HELP = `Usage: byline import mdx <dir> [options]

Import an MDX/Markdown content tree into Byline. Each post is a folder with
index.mdx plus index.<locale>.mdx translations, or a single <slug>.mdx file.

Options:
  --source-locale <code>   locale of files without a locale suffix (default: en)
  --config <file>          import config JSON (components, authors, localeAliases, categories)
  --map <file>             component mapping JSON (overrides config.components)
  --authors <file>         author profiles JSON keyed by frontmatter author key
  --locale-alias <a=b>     map a file locale to a Byline locale, e.g. zh=zh-CN (repeatable)
  --unknown <policy>       unmapped components: placeholder | skip | unwrap
  --category <slug>        category for posts without one in path or frontmatter
  --default-author <key>   author for posts without frontmatter authors (repeatable)
  --only <keys>            comma-separated slugs or post paths to import
  --limit <n>              import at most n posts
  --dry-run                print the plan; with API credentials, read-only lookups run too
  --force                  re-import posts whose content hash is unchanged
  --preserve-dates         send the frontmatter date as the post creation time
  --verbose                print one line per post and every conversion issue
  --json                   print the summary as JSON
  --api-url <url>          Byline API base URL (env BYLINE_API_URL)
  --api-key <key>          API key sent as x-api-key (env BYLINE_API_KEY)
  --token <token>          bearer session token (env BYLINE_TOKEN)

Without --api-key or --token, the session saved by \`byline login\` is used
when its API URL matches.
`

const parseAliases = (values: string[] = []) =>
  Object.fromEntries(
    values.map((value) => {
      const [from, to] = value.split('=')
      if (!from || !to) throw new Error(`Invalid --locale-alias "${value}"`)
      return [from, to]
    }),
  )

const outcomeLine = (outcome: PostOutcome) =>
  `${outcome.action.padEnd(9)} ${outcome.key}${outcome.postId ? ` #${outcome.postId}` : ''} (+${outcome.translations} locales, authors: ${outcome.authors.join(', ') || '-'})${outcome.message ? ` ${outcome.message}` : ''}`

export const runImportMdx = async (argv: string[]): Promise<number> => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'source-locale': { type: 'string' },
      config: { type: 'string' },
      map: { type: 'string' },
      authors: { type: 'string' },
      'locale-alias': { type: 'string', multiple: true },
      unknown: { type: 'string' },
      category: { type: 'string' },
      'default-author': { type: 'string', multiple: true },
      only: { type: 'string' },
      limit: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      'preserve-dates': { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      'api-url': { type: 'string' },
      'api-key': { type: 'string' },
      token: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  if (values.help) {
    process.stdout.write(IMPORT_MDX_HELP)
    return 0
  }
  const [dir] = positionals
  if (!dir) {
    process.stderr.write(IMPORT_MDX_HELP)
    return 2
  }
  const unknown = values.unknown as UnknownComponentPolicy | undefined
  if (unknown && !['placeholder', 'skip', 'unwrap'].includes(unknown)) {
    throw new Error('--unknown must be placeholder, skip or unwrap')
  }

  const config = await loadImportConfig({
    configPath: values.config,
    mapPath: values.map,
    authorsPath: values.authors,
    sourceLocale: values['source-locale'],
    localeAliases: parseAliases(values['locale-alias']),
    unknown,
    defaultCategory: values.category,
    defaultAuthors: values['default-author'],
  })

  const { apiUrl, apiKey, token, stored } = resolveApiCredentials(
    {
      apiUrl: values['api-url'],
      apiKey: values['api-key'],
      token: values.token,
    },
    process.env,
    await readCredentials(),
  )
  const dryRun = values['dry-run']
  if (!dryRun && (!apiUrl || (!apiKey && !token))) {
    throw new Error(
      'An API URL and an API key or token are required unless --dry-run is set; run `byline login` or pass --api-key',
    )
  }
  // An invalid bearer token is treated as anonymous, so public lookups would
  // quietly report every post as new instead of failing.
  if (apiUrl && token && !apiKey && !(await fetchSession(apiUrl, token))) {
    throw new Error(
      stored
        ? `The saved session for ${apiUrl} is no longer valid; run \`byline login\``
        : `The token is not a valid session for ${apiUrl}`,
    )
  }
  const client =
    apiUrl && (apiKey || token)
      ? createClient({ endpoint: apiUrl, apiKey, token })
      : null

  let plan = await planImport(dir, config)
  if (values.only) {
    const only = new Set(values.only.split(',').map((item) => item.trim()))
    plan = plan.filter((post) => only.has(post.slug) || only.has(post.key))
  }
  if (values.limit) plan = plan.slice(0, Number(values.limit))

  const result = await executeImport(plan, config, {
    root: dir,
    client,
    dryRun,
    force: values.force,
    preserveDates: values['preserve-dates'],
    onProgress: (outcome) => {
      if (values.verbose && !values.json) {
        process.stdout.write(`${outcomeLine(outcome)}\n`)
      }
    },
  })

  if (values.verbose && !values.json) {
    for (const post of plan) {
      for (const issue of post.issues) {
        process.stdout.write(
          `  ${issue.file}${issue.line ? `:${issue.line}` : ''} [${issue.kind}] ${issue.message}\n`,
        )
      }
    }
  }

  const summary = summarize(plan, result, config.componentMap, dryRun)
  process.stdout.write(
    values.json
      ? `${JSON.stringify(summary, null, 2)}\n`
      : `${dryRun ? 'Dry run' : 'Import'} of ${dir}${client ? '' : ' (offline: no API lookups)'}\n${formatSummary(summary)}\n`,
  )
  return summary.errors.length ? 1 : 0
}
