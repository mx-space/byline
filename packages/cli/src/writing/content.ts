import { readFile } from 'node:fs/promises'

import {
  coerceMeta,
  deserializeMxLitexmlToLexical,
  EnvelopeParseError,
  parseEnvelope,
} from '@mx-space/editor'

import { convertMdx } from '../mdx/convert'
import type { LexicalState } from '../mdx/lexical-nodes'
import { normalizeState } from '../mdx/normalize'
import type { WriteFields } from './fields'

export type ContentFormat = 'lexical' | 'markdown'

export interface Envelope {
  fields: WriteFields
  format?: ContentFormat
  contentXml: string
  state?: string
}

const readStdin = async () => {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

export const readContentSpec = async (spec: string) => {
  if (spec === '-' || spec === 'stdin') return readStdin()
  if (spec.startsWith('file=')) return readFile(spec.slice(5), 'utf8')
  return spec
}

export const parseFormat = (value: unknown): ContentFormat | undefined => {
  if (value === undefined) return undefined
  if (value === 'lexical' || value === 'markdown') return value
  throw new Error(`--format must be lexical or markdown, not "${value}"`)
}

export const loadEnvelope = async (spec: string): Promise<Envelope> => {
  const xml =
    spec === '-' || spec === 'stdin'
      ? await readStdin()
      : await readFile(spec, 'utf8')
  let parsed
  try {
    parsed = parseEnvelope(xml, 'post', { arrayTags: { authors: 'author' } })
  } catch (error) {
    if (error instanceof EnvelopeParseError) {
      throw new Error(`${spec}:${error.line}: ${error.message}`, {
        cause: error,
      })
    }
    throw error
  }
  const meta = coerceMeta(parsed.meta)
  const authors = parsed.meta.authors
  return {
    fields: {
      title: meta.title,
      slug: meta.slug,
      category: meta.category,
      summary: meta.summary,
      tags: meta.tags,
      authors: Array.isArray(authors) ? (authors as string[]) : undefined,
    },
    format: meta.format,
    contentXml: parsed.contentXml,
    state: meta.state,
  }
}

export const buildContent = (source: string, format: ContentFormat) => {
  if (!source.trim()) throw new Error('Content is empty')
  if (format === 'markdown') {
    const { state, markdown } = convertMdx(source, { flavor: 'md' })
    return { content: JSON.stringify(state), text: markdown }
  }
  const wrapped = source.includes('<doc') ? source : `<doc>${source}</doc>`
  let raw: LexicalState
  try {
    raw = deserializeMxLitexmlToLexical(wrapped) as unknown as LexicalState
  } catch (error) {
    throw new Error(`Failed to parse LiteXML: ${(error as Error).message}`, {
      cause: error,
    })
  }
  const { state, markdown } = normalizeState(raw, { blockIds: true })
  return { content: JSON.stringify(state), text: markdown }
}
