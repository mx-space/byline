import type { DraftWriteData } from '~/api/drafts'
import { serializeListKey } from '~/data/resource/key'

// The editor re-serializes the document with its own key order, so comparing
// the raw string would count opening a post as an edit.
const parseContent = (content: string | undefined): unknown => {
  if (content === undefined) return content
  try {
    return JSON.parse(content)
  } catch {
    return content
  }
}

export function draftFingerprint(data: DraftWriteData): string {
  const typeSpecificData: Record<string, unknown> = {
    ...data.typeSpecificData,
  }

  typeSpecificData.pin = Boolean(typeSpecificData.pin)
  if (Array.isArray(typeSpecificData.tags)) {
    typeSpecificData.tags = [...typeSpecificData.tags].sort()
  }

  return serializeListKey([
    {
      ...data,
      content: parseContent(data.content),
      images: data.images?.map((image) => image.src).sort(),
      typeSpecificData,
    },
  ])
}
