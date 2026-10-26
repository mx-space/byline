import type { EntityId } from '~/shared/id/entity-id'

import type { DraftRepository } from './draft.repository'
import type {
  ContentDocumentRow,
  ContentRevisionRow,
  DraftBranchRow,
  RevisionSnapshot,
} from './draft.types'
import { pickSnapshot, sameRevisionContent } from './draft-content'

// Fields the editor writes on load or the old autosave added; a branch that
// differs from the published revision only by these holds no real edit.
const EDITOR_NOISE_KEYS = new Set(['$', 'textFormat', 'textStyle'])
const SNAPSHOT_NOISE_KEYS = ['created', 'createdAt']

const stripEditorNoise = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripEditorNoise)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !EDITOR_NOISE_KEYS.has(key))
        .map(([key, item]) => [key, stripEditorNoise(item)]),
    )
  }
  return value
}

const stripContentNoise = (content: string | null) => {
  if (!content) return content
  try {
    return JSON.stringify(stripEditorNoise(JSON.parse(content)))
  } catch {
    return content
  }
}

const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

const withoutNoise = (revision: ContentRevisionRow): RevisionSnapshot => {
  const typeSpecificData = Object.fromEntries(
    Object.entries(revision.typeSpecificData ?? {}).filter(
      ([key, value]) => !SNAPSHOT_NOISE_KEYS.includes(key) && !isBlank(value),
    ),
  )
  if (!typeSpecificData.pin) {
    delete typeSpecificData.pin
    delete typeSpecificData.pinOrder
  }
  const content = stripContentNoise(revision.content)
  return {
    ...pickSnapshot(revision),
    content,
    images: isBlank(revision.images) ? null : revision.images,
    text: '',
    typeSpecificData,
  }
}

export const differsOnlyByNoise = (
  left: ContentRevisionRow,
  right: ContentRevisionRow,
) => sameRevisionContent(withoutNoise(left), withoutNoise(right))

const pickWorkingCopy = async (
  drafts: DraftRepository,
  document: ContentDocumentRow,
  active: DraftBranchRow[],
): Promise<DraftBranchRow | null> => {
  if (!document.publishedRevisionId) return active[0] ?? null
  const published = await drafts.findRevisionById(document.publishedRevisionId)
  if (!published) return active[0] ?? null
  for (const branch of active) {
    if (branch.headRevisionId === published.id) continue
    const ancestry = await drafts.findAncestryIds(branch.headRevisionId)
    if (!ancestry.includes(published.id)) continue
    const head = await drafts.findRevisionById(branch.headRevisionId)
    if (head && !differsOnlyByNoise(published, head)) return branch
  }
  const onPublished = active.find(
    (branch) => branch.headRevisionId === published.id,
  )
  if (onPublished) return onPublished
  const { branch } = await drafts.createBranch(
    document.id,
    published.id,
    pickSnapshot(published),
    true,
  )
  return branch
}

export async function collapseBranches(
  drafts: DraftRepository,
  documentId: EntityId | string,
): Promise<{ keep: DraftBranchRow | null; retired: DraftBranchRow[] }> {
  const document = await drafts.findDocumentById(documentId)
  if (!document) return { keep: null, retired: [] }
  const active = await drafts.findBranchesByDocument(document.id)
  const keep = await pickWorkingCopy(drafts, document, active)
  const retired = active.filter((branch) => branch.id !== keep?.id)
  for (const branch of retired) {
    await drafts.archiveBranch(branch.id)
  }
  return { keep, retired }
}
