import type { DraftRefType } from './draft.enum'
import type { RevisionSnapshot } from './draft.types'

const OMIT = Symbol('omit')

function normalizeJson(value: unknown): unknown {
  if (value === undefined) return OMIT
  if (Array.isArray(value)) {
    return value.map(normalizeJson).filter((item) => item !== OMIT)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .flatMap(([key, item]) => {
          const normalized = normalizeJson(item)
          return normalized === OMIT ? [] : [[key, normalized]]
        }),
    )
  }
  return value
}

function normalizeTypeSpecificData(
  refType: DraftRefType,
  value: Record<string, unknown> | null | undefined,
) {
  if (!value) return null
  const next = { ...value }
  for (const key of [
    'isPublished',
    'migration',
    'passwordProtected',
    'preGenerateAiResources',
  ]) {
    delete next[key]
  }

  if (refType === 'post' && 'pin' in next) next.pin = Boolean(next.pin)
  return Object.keys(next).length ? next : null
}

export function canonicalSnapshot(
  refType: DraftRefType,
  input: Partial<RevisionSnapshot>,
): RevisionSnapshot {
  return {
    content: input.content ?? null,
    contentFormat: input.contentFormat ?? 'lexical',
    images: input.images ?? null,
    meta: input.meta ?? null,
    text: input.text ?? '',
    title: input.title ?? '',
    typeSpecificData: normalizeTypeSpecificData(
      refType,
      input.typeSpecificData,
    ),
  }
}

export function sameRevisionContent(
  left: RevisionSnapshot,
  right: RevisionSnapshot,
): boolean {
  return (
    JSON.stringify(normalizeJson(left)) === JSON.stringify(normalizeJson(right))
  )
}
