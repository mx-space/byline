import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { type ConvertedDocument, convertMdx } from '../mdx/convert'
import type { ConvertIssue } from '../mdx/to-lexical'
import type { ImportConfig } from './config'
import { resolveLocale, scanContent, type SourceFile } from './scan'

export interface PostSeoInput {
  title?: string
  description?: string
  image?: string
}

export interface PlannedTranslation {
  locale: string
  file: string
  title: string
  summary?: string
  tags: string[]
  seo?: PostSeoInput
  document: ConvertedDocument
}

export interface FileIssue extends ConvertIssue {
  file: string
}

export interface PlannedPost {
  key: string
  slug: string
  category?: string
  sourceFile?: string
  sourceLocale: string
  title?: string
  summary?: string
  tags: string[]
  createdAt?: string
  image?: string
  seo?: PostSeoInput
  authorKeys: string[]
  document?: ConvertedDocument
  translations: PlannedTranslation[]
  issues: FileIssue[]
  hash: string
  skipReason?: string
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

const asStringList = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      const record = asRecord(item)
      return (
        asString(record.key) ?? asString(record.id) ?? asString(record.name)
      )
    })
    .filter((item): item is string => !!item)
}

const asDate = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString()
}

const extractMeta = (frontmatter: Record<string, unknown>) => {
  const seo = asRecord(frontmatter.seo)
  return {
    title: asString(frontmatter.title) ?? asString(seo.title),
    summary:
      asString(frontmatter.summary) ??
      asString(frontmatter.description) ??
      asString(seo.description),
    tags: asStringList(frontmatter.tags ?? seo.tags),
  }
}

const extractSeo = (
  frontmatter: Record<string, unknown>,
): PostSeoInput | undefined => {
  const record = asRecord(frontmatter.seo)
  const entries = Object.entries({
    title: asString(record.title),
    description:
      asString(record.description) ?? asString(frontmatter.description),
    image: asString(record.image),
  }).filter(([, value]) => value !== undefined)
  return entries.length ? Object.fromEntries(entries) : undefined
}

const isDraft = (frontmatter: Record<string, unknown>) =>
  frontmatter.draft === true || frontmatter.published === false

const sha256 = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')

const convertFile = async (file: SourceFile, config: ImportConfig) => {
  const source = await readFile(file.absPath, 'utf8')
  return convertMdx(source, {
    componentMap: config.componentMap,
    flavor: file.relPath.endsWith('.md') ? 'md' : 'mdx',
  })
}

const tagIssues = (document: ConvertedDocument, file: string): FileIssue[] =>
  document.issues.map((issue) => ({ ...issue, file }))

export const planImport = async (
  root: string,
  config: ImportConfig,
): Promise<PlannedPost[]> => {
  const sourceLocale = resolveLocale(config.sourceLocale, config.localeAliases)
  const posts = await scanContent(root, {
    sourceLocale,
    localeAliases: config.localeAliases,
  })
  const planned: PlannedPost[] = []

  for (const post of posts) {
    const base: PlannedPost = {
      key: post.key,
      slug: post.slug,
      sourceLocale,
      tags: [],
      authorKeys: [],
      translations: [],
      issues: post.duplicates.map((file) => ({
        kind: 'dropped-node',
        message: 'duplicate locale file ignored',
        file,
      })),
      hash: '',
    }
    if (!post.source) {
      planned.push({
        ...base,
        skipReason: `no ${sourceLocale} source file`,
      })
      continue
    }

    const document = await convertFile(post.source, config)
    const frontmatter = document.frontmatter
    const meta = extractMeta(frontmatter)
    const seo = extractSeo(frontmatter)
    const authorKeys = asStringList(frontmatter.author ?? frontmatter.authors)

    const entry: PlannedPost = {
      ...base,
      slug: asString(frontmatter.slug) ?? post.slug,
      category:
        asString(frontmatter.category) ??
        post.pathCategory ??
        config.defaultCategory,
      sourceFile: post.source.relPath,
      title: meta.title,
      summary: meta.summary,
      tags: meta.tags,
      createdAt: asDate(
        frontmatter.date ?? frontmatter.createdAt ?? frontmatter.publishedAt,
      ),
      image:
        asString(frontmatter.image) ??
        asString(frontmatter.cover) ??
        seo?.image,
      seo,
      authorKeys: authorKeys.length ? authorKeys : config.defaultAuthors,
      document,
      issues: [...base.issues, ...tagIssues(document, post.source.relPath)],
    }

    for (const file of post.translations) {
      const translated = await convertFile(file, config)
      const translatedMeta = extractMeta(translated.frontmatter)
      entry.issues.push(...tagIssues(translated, file.relPath))
      if (!translatedMeta.title) {
        entry.issues.push({
          kind: 'dropped-node',
          message: 'translation has no title and was skipped',
          file: file.relPath,
        })
        continue
      }
      entry.translations.push({
        locale: file.locale,
        file: file.relPath,
        title: translatedMeta.title,
        summary: translatedMeta.summary,
        tags: translatedMeta.tags,
        seo: extractSeo(translated.frontmatter),
        document: translated,
      })
    }

    if (!entry.title) entry.skipReason = 'missing title'
    else if (!entry.category) entry.skipReason = 'missing category'
    else if (isDraft(frontmatter)) entry.skipReason = 'marked as draft'

    entry.hash = sha256({
      slug: entry.slug,
      category: entry.category,
      title: entry.title,
      summary: entry.summary,
      tags: entry.tags,
      createdAt: entry.createdAt,
      image: entry.image,
      seo: entry.seo,
      authors: entry.authorKeys,
      sourceLocale,
      content: document.state,
      translations: entry.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        summary: translation.summary,
        tags: translation.tags,
        seo: translation.seo,
        content: translation.document.state,
      })),
    })
    planned.push(entry)
  }
  return planned
}
