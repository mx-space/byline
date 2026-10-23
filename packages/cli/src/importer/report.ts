import type { ComponentMap } from '../mdx/component-map'
import { resolveMapping } from '../mdx/component-map'
import type { ExecuteResult, PostAction } from './execute'
import type { PlannedPost } from './plan'

export interface ImportSummary {
  dryRun: boolean
  posts: { found: number } & Record<PostAction, number>
  sourceLocale: string
  locales: Record<string, number>
  translationFiles: number
  seo: { posts: number; translations: number }
  authors: { keys: number; existing: number; create: number; list: unknown[] }
  categories: { existing: number; create: number; list: unknown[] }
  components: Record<string, { count: number; target: string }>
  unmappedComponents: Record<string, { count: number; posts: number }>
  issues: Record<string, number>
  localAssets: number
  errors: Array<{ slug: string; message?: string }>
  skipped: Array<{ key: string; reason?: string }>
}

const describeTarget = (map: ComponentMap, name: string) => {
  const mapping = resolveMapping(map, name)
  if (!mapping) return `unmapped (${map.unknown})`
  if ('skip' in mapping) return 'skip'
  if ('unwrap' in mapping) return 'unwrap'
  if ('dynamic' in mapping) return `dynamic ${mapping.dynamic.url}`
  if ('markdown' in mapping) return 'markdown template'
  return mapping.node
}

export const summarize = (
  plan: PlannedPost[],
  result: ExecuteResult,
  map: ComponentMap,
  dryRun: boolean,
): ImportSummary => {
  const posts = {
    found: plan.length,
    create: 0,
    update: 0,
    unchanged: 0,
    skip: 0,
    error: 0,
  }
  for (const outcome of result.outcomes) posts[outcome.action]++

  const locales: Record<string, number> = {}
  const components: ImportSummary['components'] = {}
  const unmapped: Record<string, { count: number; posts: Set<string> }> = {}
  const issues: Record<string, number> = {}
  let translationFiles = 0
  const seo = { posts: 0, translations: 0 }

  for (const post of plan) {
    if (post.document) {
      locales[post.sourceLocale] = (locales[post.sourceLocale] ?? 0) + 1
    }
    if (post.seo) seo.posts++
    const documents = [
      ...(post.document ? [post.document] : []),
      ...post.translations.map((item) => item.document),
    ]
    for (const translation of post.translations) {
      translationFiles++
      if (translation.seo) seo.translations++
      locales[translation.locale] = (locales[translation.locale] ?? 0) + 1
    }
    for (const document of documents) {
      for (const [name, count] of Object.entries(document.components)) {
        components[name] ??= { count: 0, target: describeTarget(map, name) }
        components[name].count += count
      }
    }
    for (const issue of post.issues) {
      issues[issue.kind] = (issues[issue.kind] ?? 0) + 1
      if (issue.kind === 'unmapped-component' && issue.component) {
        unmapped[issue.component] ??= { count: 0, posts: new Set() }
        unmapped[issue.component].count++
        unmapped[issue.component].posts.add(post.key)
      }
    }
  }

  return {
    dryRun,
    posts,
    sourceLocale: plan[0]?.sourceLocale ?? '',
    locales,
    translationFiles,
    seo,
    authors: {
      keys: result.authors.length,
      existing: result.authors.filter((ref) => ref.action === 'existing')
        .length,
      create: result.authors.filter((ref) => ref.action === 'create').length,
      list: result.authors,
    },
    categories: {
      existing: result.categories.filter((ref) => ref.action === 'existing')
        .length,
      create: result.categories.filter((ref) => ref.action === 'create').length,
      list: result.categories,
    },
    components,
    unmappedComponents: Object.fromEntries(
      Object.entries(unmapped).map(([name, value]) => [
        name,
        { count: value.count, posts: value.posts.size },
      ]),
    ),
    issues,
    localAssets: result.outcomes.reduce(
      (sum, item) => sum + item.localAssets,
      0,
    ),
    errors: result.outcomes
      .filter((item) => item.action === 'error')
      .map((item) => ({ slug: item.slug, message: item.message })),
    skipped: result.outcomes
      .filter((item) => item.action === 'skip')
      .map((item) => ({ key: item.key, reason: item.message })),
  }
}

const list = (record: Record<string, number>) =>
  Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => `${key} ${value}`)
    .join(', ')

export const formatSummary = (summary: ImportSummary): string => {
  const verb = summary.dryRun ? 'would' : 'did'
  const { posts } = summary
  const lines = [
    `Posts: ${posts.found} found; ${verb} create ${posts.create}, update ${posts.update}; unchanged ${posts.unchanged}, skipped ${posts.skip}, errors ${posts.error}`,
    `Locales: ${Object.keys(summary.locales).length} (source ${summary.sourceLocale}); ${summary.translationFiles} translation files [${list(summary.locales)}]`,
    `SEO: ${summary.seo.posts} posts, ${summary.seo.translations} translations`,
    `Authors: ${summary.authors.keys} keys; ${summary.authors.existing} existing, ${verb} create ${summary.authors.create} profile-only`,
    `Categories: ${summary.categories.existing} existing, ${verb} create ${summary.categories.create}`,
    `Components: ${
      Object.entries(summary.components)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([name, value]) => `${name} ${value.count} -> ${value.target}`)
        .join('; ') || 'none'
    }`,
    `Unmapped components: ${
      Object.entries(summary.unmappedComponents)
        .map(
          ([name, value]) => `${name} ${value.count} (in ${value.posts} posts)`,
        )
        .join(', ') || 'none'
    }`,
    `Issues: ${list(summary.issues) || 'none'}`,
  ]
  if (summary.localAssets) {
    lines.push(
      `Local assets: ${summary.localAssets} ${verb === 'would' ? 'would be' : 'were'} uploaded`,
    )
  }
  for (const skipped of summary.skipped) {
    lines.push(`  skipped ${skipped.key}: ${skipped.reason ?? ''}`)
  }
  for (const error of summary.errors) {
    lines.push(`  error ${error.slug}: ${error.message ?? ''}`)
  }
  return lines.join('\n')
}
