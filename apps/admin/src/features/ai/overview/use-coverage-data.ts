import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { AiOverviewListRow } from '~/api/ai-overview'
import { getOverviewGrouped } from '~/api/ai-overview'
import type { AITask } from '~/api/tasks'
import { getTasks } from '~/api/tasks'
import { adminQueryKeys } from '~/query/keys'

import { buildMatrixRows, groupActiveTasks } from './coverage'

const PAGE_SIZE = 50
const MAX_PAGES = 40
const LIVE_POLL_MS = 3000
const IDLE_POLL_MS = 30_000

export const coverageListKey = [
  ...adminQueryKeys.ai.overviewListRoot,
  'all',
] as const
const coverageTasksKey = [
  ...adminQueryKeys.tasks.tasksRoot,
  'ai-coverage',
] as const

/**
 * The overview endpoint pages by post and has no gap filter, so the matrix
 * loads every page and filters on the client.
 */
async function fetchAllCoverage(): Promise<AiOverviewListRow[]> {
  const rows: AiOverviewListRow[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await getOverviewGrouped({
      page,
      size: PAGE_SIZE,
      type: 'post',
    })
    rows.push(...response.data)
    const pagination = response.pagination
    const totalPages =
      pagination?.totalPages ??
      pagination?.totalPage ??
      (pagination ? Math.ceil(pagination.total / pagination.size) : page)
    if (page >= totalPages) break
  }
  return rows
}

async function fetchCoverageTasks(): Promise<AITask[]> {
  const response = await getTasks({
    includeSubTasks: true,
    scope: 'ai',
    size: 100,
    status: ['pending', 'running', 'failed', 'partial_failed'],
  })
  return Array.isArray(response) ? response : response.data
}

export function useCoverageData() {
  const listQuery = useQuery({
    queryFn: fetchAllCoverage,
    queryKey: coverageListKey,
  })
  const tasksQuery = useQuery({
    queryFn: fetchCoverageTasks,
    queryKey: coverageTasksKey,
    refetchInterval: (query) =>
      query.state.data?.some(
        (task) => task.status === 'pending' || task.status === 'running',
      )
        ? LIVE_POLL_MS
        : IDLE_POLL_MS,
  })

  const rows = useMemo(
    () =>
      buildMatrixRows(
        listQuery.data ?? [],
        groupActiveTasks(tasksQuery.data ?? []),
      ),
    [listQuery.data, tasksQuery.data],
  )

  return { listQuery, rows, tasksQuery }
}
