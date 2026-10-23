import type {
  ActiveGeneration,
  AiOverviewCapability,
  AiOverviewListRow,
  ArticleCoverage,
} from '~/api/ai-overview'
import type { AITask } from '~/api/tasks'

import { resolveCell } from '../components/article-overview/coverage-cells'

export const MATRIX_CAPABILITIES = [
  'translation',
  'summary',
  'insights',
  'tts',
] as const satisfies readonly AiOverviewCapability[]

export type LangState = 'done' | 'failed' | 'gap' | 'pending'

export interface LangCell {
  lang: string
  state: LangState
}

export type CapabilityState =
  'done' | 'failed' | 'gap' | 'na' | 'none' | 'pending'

export interface CapabilitySummary {
  /** Missing or failed languages a fill would generate. */
  fillable: string[]
  langs: LangCell[]
  state: CapabilityState
}

const FAILURE_RETENTION_MS = 10 * 60 * 1000

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []

function taskTargets(task: AITask): {
  capability: AiOverviewCapability
  langs: string[]
  refIds: string[]
} | null {
  const payload = task.payload ?? {}
  const refId = typeof payload.refId === 'string' ? [payload.refId] : []
  const single =
    typeof payload.targetLang === 'string' ? [payload.targetLang] : []
  switch (task.type as string) {
    case 'ai:summary': {
      return {
        capability: 'summary',
        langs: asStringArray(payload.targetLanguages),
        refIds: refId,
      }
    }
    case 'ai:summary:translation': {
      return { capability: 'summary', langs: single, refIds: refId }
    }
    case 'ai:insights': {
      return {
        capability: 'insights',
        langs: asStringArray(payload.targetLanguages),
        refIds: refId,
      }
    }
    case 'ai:insights:translation': {
      return { capability: 'insights', langs: single, refIds: refId }
    }
    case 'ai:translation': {
      return {
        capability: 'translation',
        langs: asStringArray(payload.targetLanguages),
        refIds: refId,
      }
    }
    case 'ai:translation:batch': {
      return {
        capability: 'translation',
        langs: asStringArray(payload.targetLanguages),
        refIds: asStringArray(payload.refIds),
      }
    }
    case 'ai:tts': {
      return {
        capability: 'tts',
        langs: asStringArray(payload.langs),
        refIds: refId,
      }
    }
    default: {
      return null
    }
  }
}

/**
 * Client-side mirror of the server's per-article active-task scan, so the
 * matrix can mark running and recently failed cells without one request per
 * post. Failures age out like they do on the per-post overview.
 */
export function groupActiveTasks(
  tasks: AITask[],
  now = Date.now(),
): Map<string, ActiveGeneration[]> {
  const byRef = new Map<string, ActiveGeneration[]>()
  for (const task of tasks) {
    const failed = task.status === 'failed' || task.status === 'partial_failed'
    if (
      failed &&
      (task.completedAt ?? task.createdAt) < now - FAILURE_RETENTION_MS
    ) {
      continue
    }
    const targets = taskTargets(task)
    if (!targets) continue
    const generation: ActiveGeneration = {
      capability: targets.capability,
      completedItems: task.completedItems ?? null,
      error: failed ? (task.error ?? null) : null,
      langs: targets.langs,
      progress: task.progress ?? null,
      progressMessage: task.progressMessage ?? null,
      startedAt: task.startedAt ?? null,
      status: task.status,
      taskId: task.id,
      totalItems: task.totalItems ?? null,
    }
    for (const refId of targets.refIds) {
      const list = byRef.get(refId) ?? []
      list.push(generation)
      byRef.set(refId, list)
    }
  }
  return byRef
}

function capabilityLangs(
  coverage: ArticleCoverage,
  capability: AiOverviewCapability,
): string[] {
  const cell = coverage[capability]
  const langs = new Set([...cell.expected, ...cell.langs])
  if (capability === 'translation' && coverage.sourceLang) {
    langs.delete(coverage.sourceLang)
  }
  return [...langs].sort()
}

export function summarizeCapability(
  coverage: ArticleCoverage,
  capability: AiOverviewCapability,
  activeTasks: ActiveGeneration[] = [],
): CapabilitySummary {
  if (!coverage[capability].applicable) {
    return { fillable: [], langs: [], state: 'na' }
  }
  const langs: LangCell[] = []
  for (const lang of capabilityLangs(coverage, capability)) {
    const cell = resolveCell(coverage, capability, lang, activeTasks)
    if (cell === 'has') langs.push({ lang, state: 'done' })
    else if (cell === 'pending') langs.push({ lang, state: 'pending' })
    else if (cell === 'failed') langs.push({ lang, state: 'failed' })
    else if (cell === 'gap') langs.push({ lang, state: 'gap' })
  }
  const fillable = langs
    .filter((cell) => cell.state === 'gap' || cell.state === 'failed')
    .map((cell) => cell.lang)
  const has = (state: LangState) => langs.some((cell) => cell.state === state)
  const state: CapabilityState = has('pending')
    ? 'pending'
    : has('failed')
      ? 'failed'
      : has('gap')
        ? 'gap'
        : langs.length
          ? 'done'
          : 'none'
  return { fillable, langs, state }
}

export interface MatrixRow {
  article: AiOverviewListRow['article']
  capabilities: Record<AiOverviewCapability, CapabilitySummary>
  coverage: ArticleCoverage
  gapCount: number
}

export function buildMatrixRows(
  rows: AiOverviewListRow[],
  activeByRef: Map<string, ActiveGeneration[]>,
): MatrixRow[] {
  return rows.map((row) => {
    const active = activeByRef.get(row.article.id) ?? []
    const capabilities = Object.fromEntries(
      MATRIX_CAPABILITIES.map((capability) => [
        capability,
        summarizeCapability(row.coverage, capability, active),
      ]),
    ) as Record<AiOverviewCapability, CapabilitySummary>
    const gapCount = MATRIX_CAPABILITIES.reduce(
      (total, capability) => total + capabilities[capability].fillable.length,
      0,
    )
    return {
      article: row.article,
      capabilities,
      coverage: row.coverage,
      gapCount,
    }
  })
}

export function hasGap(row: MatrixRow, capability?: AiOverviewCapability) {
  if (capability) return row.capabilities[capability].fillable.length > 0
  return row.gapCount > 0
}

export function countGaps(rows: MatrixRow[]) {
  const posts = rows.filter((row) => hasGap(row)).length
  const byCapability = Object.fromEntries(
    MATRIX_CAPABILITIES.map((capability) => {
      const affected = rows.filter((row) => hasGap(row, capability))
      return [
        capability,
        {
          items: affected.reduce(
            (total, row) =>
              total + row.capabilities[capability].fillable.length,
            0,
          ),
          posts: affected.length,
        },
      ]
    }),
  ) as Record<AiOverviewCapability, { items: number; posts: number }>
  return { byCapability, posts }
}

export interface FillJob {
  capability: AiOverviewCapability
  langs: string[]
  refIds: string[]
}

const MAX_LANGS_PER_TASK = 8
const MAX_REFS_PER_BATCH = 100

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

/**
 * One job per post, except translations: posts missing the same set of
 * languages share a single batch task. Jobs are split to the server's
 * per-task limits.
 */
export function buildFillJobs(
  rows: MatrixRow[],
  capabilities: readonly AiOverviewCapability[],
): FillJob[] {
  return collectFillJobs(rows, capabilities).flatMap((job) =>
    chunk(job.refIds, MAX_REFS_PER_BATCH).flatMap((refIds) =>
      chunk(job.langs, MAX_LANGS_PER_TASK).map((langs) => ({
        capability: job.capability,
        langs,
        refIds,
      })),
    ),
  )
}

function collectFillJobs(
  rows: MatrixRow[],
  capabilities: readonly AiOverviewCapability[],
): FillJob[] {
  const jobs: FillJob[] = []
  for (const capability of capabilities) {
    if (capability === 'translation') {
      const byLangs = new Map<string, FillJob>()
      for (const row of rows) {
        const langs = row.capabilities.translation.fillable
        if (!langs.length) continue
        const key = langs.join(',')
        const job = byLangs.get(key)
        if (job) job.refIds.push(row.article.id)
        else byLangs.set(key, { capability, langs, refIds: [row.article.id] })
      }
      jobs.push(...byLangs.values())
      continue
    }
    for (const row of rows) {
      const langs = row.capabilities[capability].fillable
      if (langs.length)
        jobs.push({ capability, langs, refIds: [row.article.id] })
    }
  }
  return jobs
}
