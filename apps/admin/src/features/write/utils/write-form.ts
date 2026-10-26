import { projectAgentDiffNodesToFactualState } from '@haklex/rich-ext-ai-agent/static'
import { mxLexicalToMarkdown } from '@mx-space/editor'
import type { SerializedEditorState } from 'lexical'

import type { DraftWriteData } from '~/api/drafts'
import type { PostBylineState } from '~/features/write/utils/post-byline-state'
import {
  emptyPostBylineState,
  postBylineFromSpecific,
  postBylineToSpecific,
} from '~/features/write/utils/post-byline-state'
import type { DraftFields, RevisionSnapshot } from '~/models/draft'

export type WriteKind = 'post'

export interface WriteFormState extends PostBylineState {
  categoryId: string
  content: string
  images: NonNullable<RevisionSnapshot['images']>
  meta: Record<string, unknown>
  pin: boolean
  pinOrder: string
  publishedAt: string
  slug: string
  summary: string
  tags: string
  text: string
  title: string
}

export const emptyState: WriteFormState = {
  ...emptyPostBylineState,
  categoryId: '',
  content: '',
  images: [],
  meta: {},
  pin: false,
  pinOrder: '1',
  publishedAt: '',
  slug: '',
  summary: '',
  tags: '',
  text: '',
  title: '',
}

export const fieldsOf = (data: DraftWriteData): DraftFields => ({
  meta: data.meta ?? null,
  typeSpecificData: (data.typeSpecificData ??
    null) as DraftFields['typeSpecificData'],
})

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function asRecord(
  value: unknown,
  fallback: Record<string, unknown> = {},
): Record<string, unknown> {
  return isRecord(value) ? value : fallback
}

export function fromRevision(
  kind: WriteKind,
  draft: RevisionSnapshot | DraftWriteData,
  previous: WriteFormState,
): WriteFormState {
  const specific = (draft.typeSpecificData ?? {}) as Record<string, any>
  return {
    ...previous,
    ...postBylineFromSpecific(specific, previous),
    content: draft.content ?? '',
    images: draft.images ?? previous.images,
    meta: asRecord(draft.meta, previous.meta),
    text: draft.text ?? '',
    title: draft.title ?? '',
    categoryId:
      typeof specific.categoryId === 'string'
        ? specific.categoryId
        : previous.categoryId,
    pin: 'pin' in specific ? Boolean(specific.pin) : previous.pin,
    pinOrder:
      typeof specific.pinOrder === 'number'
        ? String(specific.pinOrder)
        : previous.pinOrder,
    publishedAt:
      typeof specific.created === 'string'
        ? specific.created
        : previous.publishedAt,
    slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
    summary:
      'summary' in specific
        ? typeof specific.summary === 'string'
          ? specific.summary
          : ''
        : previous.summary,
    tags: Array.isArray(specific.tags)
      ? specific.tags.map((tag) => String(tag)).join(', ')
      : previous.tags,
  }
}

export function toDraftData(
  _kind: WriteKind,
  state: WriteFormState,
  _refId?: string,
): DraftWriteData {
  state = projectWriteState(state)

  return {
    content: state.content,
    contentFormat: 'lexical',
    meta: state.meta,
    text: state.text,
    title: state.title.trim() || state.title,
    typeSpecificData: {
      ...postBylineToSpecific(state),
      categoryId: state.categoryId,
      pin: state.pin,
      pinOrder: state.pin ? Number(state.pinOrder) || 1 : undefined,
      ...(state.publishedAt ? { created: state.publishedAt } : {}),
      slug: state.slug,
      summary: state.summary || null,
      tags: state.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    },
  }
}

// Pending AI diff decorators (agent-diff) are transient review UI and must
// never be persisted — project them back to their factual (original) side.
function stripPendingAgentDiffs(content: string): string {
  if (!content.includes('"agent-diff"')) return content
  try {
    const editorState = JSON.parse(content) as SerializedEditorState
    return JSON.stringify(projectAgentDiffNodesToFactualState(editorState))
  } catch {
    return content
  }
}

export function projectWriteState(state: WriteFormState): WriteFormState {
  if (!state.content.trim()) return state
  const content = stripPendingAgentDiffs(state.content)
  return {
    ...state,
    content,
    text: mxLexicalToMarkdown(content),
  }
}

// The form drops, renames and defaults some stored fields, so the baseline is the head as
// the form would send it back; otherwise opening an article would patch fields nobody edited.
export const formFieldsOf = (
  kind: WriteKind,
  head: RevisionSnapshot | DraftWriteData,
  previous: WriteFormState,
): DraftFields =>
  fieldsOf(toDraftData(kind, fromRevision(kind, head, previous)))
