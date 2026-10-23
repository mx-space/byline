import { Button, Divider, Empty, Tag, Text } from '@lobehub/ui'
import { Section } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { useNavigate } from 'react-router'

import { useTaskActions } from '~/features/tasks/hooks/use-task-actions'
import { useTaskSubjects } from '~/features/tasks/hooks/use-task-subjects'
import { useI18n } from '~/i18n'

import { deskAiGapPreviewLimit, deskWritingItemLimit } from '../constants'
import { useDashboardCopy } from '../copy'
import { aiCoverageQuery, draftsQuery, failedTasksQuery } from '../queries'
import {
  aiGapRows,
  aiOverviewArticlePath,
  aiOverviewPath,
  buildWritingItems,
  displayDeskTime,
  draftsPath,
  failedTasksPath,
  newPostPath,
} from '../utils/desk'
import { DeskGroup, DeskQueryState } from './DeskGroup'
import { DeskRecordLink } from './DeskRecordLink'
import { DeskTaskRow } from './DeskTaskRow'

export function PendingSection() {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const navigate = useNavigate()
  const failedQuery = useQuery(failedTasksQuery)
  const draftsResult = useQuery(draftsQuery)
  const aiQuery = useQuery(aiCoverageQuery)
  const taskActions = useTaskActions()

  const failedTasks = failedQuery.data?.data ?? []
  const failedTotal = failedQuery.data?.total ?? 0
  const subjectOf = useTaskSubjects(failedTasks)
  const writing = buildWritingItems(draftsResult.data?.data ?? [])
  const gaps = aiGapRows(aiQuery.data?.data ?? [])

  const showFailed = !failedQuery.data || failedQuery.isError || failedTotal > 0
  const showWriting =
    !draftsResult.data || draftsResult.isError || writing.length > 0
  const showGaps = !aiQuery.data || aiQuery.isError || gaps.length > 0

  const groups: Array<{ key: string; node: ReactNode }> = []

  if (showFailed) {
    groups.push({
      key: 'failed',
      node: (
        <DeskGroup
          count={failedTotal > 0 ? format.number(failedTotal) : undefined}
          more={
            failedTotal > failedTasks.length ? copy('viewAllFailed') : undefined
          }
          moreTo={failedTasksPath}
          title={copy('failuresTitle')}
        >
          <DeskQueryState
            errorMessage={copy('failuresError')}
            query={failedQuery}
          >
            {failedTasks.map((task) => (
              <DeskTaskRow
                category="failed"
                key={task.id}
                onRetry={taskActions.retry}
                retrying={taskActions.retryingId === task.id}
                subject={subjectOf(task)}
                task={task}
              />
            ))}
          </DeskQueryState>
        </DeskGroup>
      ),
    })
  }

  if (showWriting) {
    groups.push({
      key: 'writing',
      node: (
        <DeskGroup
          count={writing.length > 0 ? format.number(writing.length) : undefined}
          more={copy('viewDrafts')}
          moreTo={draftsPath}
          title={copy('writingTitle')}
        >
          <DeskQueryState
            errorMessage={copy('draftsError')}
            query={draftsResult}
          >
            {writing.slice(0, deskWritingItemLimit).map((item) => (
              <DeskRecordLink
                key={item.id}
                meta={
                  <>
                    <Tag
                      color={item.status === 'modified' ? 'warning' : undefined}
                      size="small"
                    >
                      {item.status === 'modified'
                        ? copy('writingModified')
                        : copy('writingUnpublished')}
                    </Tag>
                    {item.branchCount > 1 ? (
                      <Text as="span" type="secondary">
                        {copy('writingBranches', { count: item.branchCount })}
                      </Text>
                    ) : null}
                    <Text as="span" type="secondary">
                      {displayDeskTime(format.relativeTime(item.time))}
                    </Text>
                  </>
                }
                title={item.title || copy('untitled')}
                to={item.to}
              />
            ))}
          </DeskQueryState>
        </DeskGroup>
      ),
    })
  }

  if (showGaps) {
    groups.push({
      key: 'ai',
      node: (
        <DeskGroup
          count={gaps.length > 0 ? format.number(gaps.length) : undefined}
          more={copy('viewAiOverview')}
          moreTo={aiOverviewPath}
          title={copy('aiGapsTitle')}
        >
          <DeskQueryState
            errorMessage={copy('aiGapsError')}
            query={aiQuery}
            rows={2}
          >
            {gaps.slice(0, deskAiGapPreviewLimit).map((row) => (
              <DeskRecordLink
                key={row.article.id}
                meta={
                  <Tag size="small">
                    {copy('aiGapCount', { count: row.gapCount })}
                  </Tag>
                }
                title={row.article.title || copy('untitled')}
                to={aiOverviewArticlePath(row.article.id)}
              />
            ))}
          </DeskQueryState>
        </DeskGroup>
      ),
    })
  }

  return (
    <Section gap={12} title={copy('pendingTitle')} variant="card">
      {groups.length === 0 ? (
        <Empty
          action={
            <Button onClick={() => navigate(newPostPath)}>
              {copy('writePost')}
            </Button>
          }
          icon={CircleCheck}
          title={copy('pendingEmptyTitle')}
        />
      ) : (
        groups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 ? <Divider /> : null}
            {group.node}
          </Fragment>
        ))
      )}
    </Section>
  )
}
