import type { TranslationKey } from '~/i18n/types'
import type { ContentRevision } from '~/models/draft'

const FIELD_LABEL: Record<string, TranslationKey> = {
  publicAt: 'write.recovery.field.publicAt',
  categoryId: 'write.recovery.field.category',
  pin: 'write.recovery.field.pin',
  pinOrder: 'write.recovery.field.pinOrder',
  slug: 'write.recovery.field.slug',
  summary: 'write.recovery.field.summary',
  tags: 'write.recovery.field.tags',
}

export interface RevisionChangeSummary {
  charDelta: number
  fieldKeys: TranslationKey[]
  titleChanged: boolean
}

const stable = (value: unknown) => {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) return JSON.stringify([...value].sort())
  return JSON.stringify(value)
}

export const summarizeRevisionChange = (
  base: ContentRevision,
  head: ContentRevision,
): RevisionChangeSummary => {
  const baseData = base.typeSpecificData ?? {}
  const headData = head.typeSpecificData ?? {}
  const fieldKeys: TranslationKey[] = []
  for (const [field, label] of Object.entries(FIELD_LABEL)) {
    const left = baseData[field as keyof typeof baseData]
    const right = headData[field as keyof typeof headData]
    if (stable(left) !== stable(right)) fieldKeys.push(label)
  }
  if (stable(base.meta) !== stable(head.meta)) {
    fieldKeys.push('write.recovery.field.meta')
  }
  if ((base.images?.length ?? 0) !== (head.images?.length ?? 0)) {
    fieldKeys.push('write.recovery.field.images')
  }

  return {
    charDelta: [...head.text].length - [...base.text].length,
    fieldKeys,
    titleChanged: base.title !== head.title,
  }
}

export const formatCharCount = (chars: number) =>
  chars >= 1000 ? `${(chars / 1000).toFixed(1)}k` : String(chars)
