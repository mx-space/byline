import {
  buildContent,
  type ContentFormat,
  type Envelope,
  loadEnvelope,
  parseFormat,
  readContentSpec,
} from './content'
import { mergeFields, splitList, type WriteFields } from './fields'

export const WRITE_OPTIONS = {
  title: { type: 'string' },
  slug: { type: 'string' },
  category: { type: 'string' },
  summary: { type: 'string' },
  tags: { type: 'string' },
  authors: { type: 'string' },
  content: { type: 'string' },
  format: { type: 'string' },
  file: { type: 'string' },
  state: { type: 'string' },
} as const

export const WRITE_HELP = `Write flags (the same as mxs, plus --authors; flags override the envelope):
  --file <path|->          <mxpost> LiteXML envelope with <meta> and <content>
  --content <spec>         body: inline text, file=<path>, - or stdin
  --format <f>             lexical (LiteXML, default) or markdown
  --title <text>
  --slug <slug>
  --category <key>         category slug, name or id
  --summary <text>
  --tags <a,b>
  --authors <a,b>          ordered byline: usernames, emails or user ids
                           (envelope: <authors><author>ada</author></authors>)
  --state draft            the only state; publishing is done in the admin
`

export interface WriteInput {
  fields: WriteFields
  body: { content: string; text: string } | null
}

export const readWriteInput = async (
  values: Record<string, unknown>,
): Promise<WriteInput> => {
  const state = values.state as string | undefined
  const envelope: Envelope | null =
    typeof values.file === 'string' ? await loadEnvelope(values.file) : null
  const requestedState = state ?? envelope?.state
  if (requestedState && requestedState !== 'draft') {
    throw new Error(
      `State "${requestedState}" is not supported: byline CLI only writes drafts`,
    )
  }
  const flags: WriteFields = {
    title: values.title as string | undefined,
    slug: values.slug as string | undefined,
    category: values.category as string | undefined,
    summary: values.summary as string | undefined,
    tags: typeof values.tags === 'string' ? splitList(values.tags) : undefined,
    authors:
      typeof values.authors === 'string'
        ? splitList(values.authors)
        : undefined,
  }
  const format: ContentFormat =
    parseFormat(values.format) ?? envelope?.format ?? 'lexical'
  const source =
    typeof values.content === 'string'
      ? await readContentSpec(values.content)
      : envelope?.contentXml.trim()
        ? envelope.contentXml
        : undefined
  return {
    fields: mergeFields(envelope?.fields ?? {}, flags),
    body: source === undefined ? null : buildContent(source, format),
  }
}
