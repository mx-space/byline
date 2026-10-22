import type { Root } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

export interface SplitFrontmatter {
  data: Record<string, unknown>
  body: string
  bodyLineOffset: number
}

const FRONTMATTER = /^\uFEFF?---[\t ]*\r?\n(.*?)\r?\n---[\t ]*(?:\r?\n|$)/s

export const splitFrontmatter = (source: string): SplitFrontmatter => {
  const match = FRONTMATTER.exec(source)
  if (!match) return { data: {}, body: source, bodyLineOffset: 0 }
  const parsed = parseYaml(match[1]) as unknown
  const data =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  return {
    data,
    body: source.slice(match[0].length),
    bodyLineOffset: match[0].split('\n').length - 1,
  }
}

export type MdxFlavor = 'mdx' | 'md'

const mdxProcessor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm)
const mdProcessor = unified().use(remarkParse).use(remarkGfm)

export const parseMarkdown = (body: string, flavor: MdxFlavor = 'mdx'): Root =>
  (flavor === 'mdx' ? mdxProcessor : mdProcessor).parse(body) as Root
