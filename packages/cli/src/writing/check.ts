import {
  type BylineClient,
  type DraftBranch,
  isBylineApiError,
} from '@mx-space/byline-api-client'

import { SEO_DESCRIPTION_LIMIT, SEO_TITLE_LIMIT } from './limits'

export interface CheckIssue {
  code: string
  message: string
}

export interface DraftCheckResult {
  issues: CheckIssue[]
  notes: string[]
}

type SeoFields = {
  description?: string | null
  title?: string | null
}

const seoOf = (data: Record<string, unknown>): SeoFields => {
  const seo = data.seo
  if (!seo || typeof seo !== 'object') return {}
  return seo as SeoFields
}

export const collectSeoIssues = (input: {
  seo?: SeoFields | null
  title: string
}): CheckIssue[] => {
  const issues: CheckIssue[] = []
  const seoTitle = input.seo?.title?.trim() || input.title.trim()
  if (seoTitle.length > SEO_TITLE_LIMIT) {
    issues.push({
      code: 'seo_title_too_long',
      message: `SEO title is ${seoTitle.length} characters (limit ${SEO_TITLE_LIMIT})`,
    })
  }
  const description = input.seo?.description ?? ''
  if (description.length > SEO_DESCRIPTION_LIMIT) {
    issues.push({
      code: 'seo_description_too_long',
      message: `SEO description is ${description.length} characters (limit ${SEO_DESCRIPTION_LIMIT})`,
    })
  }
  return issues
}

const uniqueIds = (draft: DraftBranch) => {
  const ids = [
    String(draft.document.id),
    draft.id,
    draft.document.refId ? String(draft.document.refId) : '',
  ]
  return [...new Set(ids.filter(Boolean))]
}

const isMissingRef = (error: unknown) =>
  isBylineApiError(error) &&
  (error.status === 404 ||
    error.code === 'CONTENT_NOT_FOUND' ||
    error.code === 'CONTENT_NOT_FOUND_CANT_PROCESS')

export const checkDraft = async (
  client: BylineClient,
  draft: DraftBranch,
): Promise<DraftCheckResult> => {
  const data = draft.headRevision.typeSpecificData ?? {}
  const issues = collectSeoIssues({
    title: draft.headRevision.title,
    seo: seoOf(data),
  })
  const notes: string[] = []
  const manualSummary =
    typeof data.summary === 'string' ? data.summary.trim() : ''

  let hasAiSummary = false
  let hasTranslation = false
  let coverageFailed = false

  for (const id of uniqueIds(draft)) {
    try {
      const { data: summaries } = await client.summaries.listByRef(id)
      if (summaries.summaries.some((row) => row.summary?.trim())) {
        hasAiSummary = true
      }
    } catch (error) {
      if (!isMissingRef(error)) coverageFailed = true
    }
    try {
      const { data: translations } = await client.translations.listByRef(id)
      if (translations.translations.length > 0) hasTranslation = true
    } catch (error) {
      if (!isMissingRef(error)) coverageFailed = true
    }
  }

  if (!manualSummary && !hasAiSummary) {
    issues.push({
      code: 'missing_summary',
      message: 'No manual or AI summary',
    })
  }
  if (!hasTranslation) {
    issues.push({
      code: 'missing_translation',
      message: 'No translations',
    })
  }
  if (coverageFailed) {
    notes.push(
      'Could not fully read AI coverage from the server; summary and translation checks may be incomplete until the server that resolves draft IDs is deployed',
    )
  }
  return { issues, notes }
}

export const formatCheckResult = (
  draft: DraftBranch,
  result: DraftCheckResult,
) => {
  const title = draft.headRevision.title.trim() || '(untitled)'
  const lines = [`Check draft ${draft.id} (${title})`]
  if (result.issues.length === 0) {
    lines.push('No issues found')
  } else {
    lines.push('Issues:')
    for (const issue of result.issues) lines.push(`- ${issue.message}`)
    lines.push(
      `${result.issues.length} issue${result.issues.length === 1 ? '' : 's'}`,
    )
  }
  for (const note of result.notes) lines.push(note)
  return lines.join('\n')
}
