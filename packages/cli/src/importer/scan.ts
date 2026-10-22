import { readdir } from 'node:fs/promises'
import path from 'node:path'

export interface SourceFile {
  absPath: string
  relPath: string
  locale: string
}

export interface PostSource {
  key: string
  slug: string
  pathCategory?: string
  source?: SourceFile
  translations: SourceFile[]
  duplicates: string[]
}

export interface ScanOptions {
  sourceLocale: string
  localeAliases: Record<string, string>
}

const CONTENT_EXT = /\.(mdx|md)$/i
const LOCALE_SUFFIX = /^[a-z]{2,3}(?:[_-][\da-z]{2,8})*$/i

export const canonicalLocale = (raw: string) =>
  raw
    .replaceAll('_', '-')
    .split('-')
    .map((part, index) => {
      if (index === 0) return part.toLowerCase()
      if (part.length === 4)
        return part[0].toUpperCase() + part.slice(1).toLowerCase()
      if (part.length === 2 || /^\d{3}$/.test(part)) return part.toUpperCase()
      return part.toLowerCase()
    })
    .join('-')

export const resolveLocale = (
  raw: string,
  aliases: Record<string, string>,
): string => {
  const alias = aliases[raw] ?? aliases[canonicalLocale(raw)]
  return canonicalLocale(alias ?? raw)
}

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') return []
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      return entry.isFile() && CONTENT_EXT.test(entry.name) ? [full] : []
    }),
  )
  return nested.flat()
}

interface ParsedName {
  postKey: string
  rawLocale?: string
}

const parseName = (relPath: string): ParsedName => {
  const dir = path.posix.dirname(relPath)
  const base = path.posix.basename(relPath).replace(CONTENT_EXT, '')
  const dot = base.lastIndexOf('.')
  const stem = dot > 0 ? base.slice(0, dot) : base
  const suffix = dot > 0 ? base.slice(dot + 1) : undefined
  const rawLocale = suffix && LOCALE_SUFFIX.test(suffix) ? suffix : undefined
  const name = rawLocale ? stem : base
  if (name === 'index') {
    return { postKey: dir === '.' ? '' : dir, rawLocale }
  }
  return {
    postKey: dir === '.' ? name : `${dir}/${name}`,
    rawLocale,
  }
}

export const scanContent = async (
  root: string,
  options: ScanOptions,
): Promise<PostSource[]> => {
  const absRoot = path.resolve(root)
  const sourceLocale = resolveLocale(
    options.sourceLocale,
    options.localeAliases,
  )
  const files = (await walk(absRoot)).sort()
  const posts = new Map<string, PostSource>()

  for (const absPath of files) {
    const relPath = path.relative(absRoot, absPath).split(path.sep).join('/')
    const { postKey, rawLocale } = parseName(relPath)
    if (!postKey) continue
    const segments = postKey.split('/')
    const post = posts.get(postKey) ?? {
      key: postKey,
      slug: segments.at(-1)!,
      pathCategory: segments.length > 1 ? segments.at(-2) : undefined,
      translations: [],
      duplicates: [],
    }
    posts.set(postKey, post)
    const locale = rawLocale
      ? resolveLocale(rawLocale, options.localeAliases)
      : sourceLocale
    const file: SourceFile = { absPath, relPath, locale }
    if (locale === sourceLocale) {
      if (post.source && rawLocale) {
        post.duplicates.push(relPath)
      } else {
        if (post.source) post.duplicates.push(post.source.relPath)
        post.source = file
      }
    } else if (post.translations.some((item) => item.locale === locale)) {
      post.duplicates.push(relPath)
    } else {
      post.translations.push(file)
    }
  }
  return [...posts.values()]
}
