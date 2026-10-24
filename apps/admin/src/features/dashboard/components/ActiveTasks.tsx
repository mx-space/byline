import { Section } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'

import { useTaskSubjects } from '~/features/tasks/hooks/use-task-subjects'
import { useI18n } from '~/i18n'

import { useDashboardCopy } from '../copy'
import { activeTasksQuery } from '../queries'
import { activeTasksPath } from '../utils/desk'
import { DeskQueryState } from './DeskGroup'
import { DeskTaskRow } from './DeskTaskRow'

export function ActiveTasks() {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const query = useQuery(activeTasksQuery)
  const tasks = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const subjectOf = useTaskSubjects(tasks)

  if (query.data && !query.isError && total === 0) return null

  return (
    <Section
      extra={total > 0 ? format.number(total) : undefined}
      gap={4}
      more={total > tasks.length ? copy('viewAllActive') : undefined}
      moreLink={total > tasks.length ? activeTasksPath : undefined}
      title={copy('activeTitle')}
      variant="card"
    >
      <DeskQueryState errorMessage={copy('activeError')} query={query} rows={2}>
        {tasks.map((task) => (
          <DeskTaskRow
            category="active"
            key={task.id}
            subject={subjectOf(task)}
            task={task}
          />
        ))}
      </DeskQueryState>
    </Section>
  )
}
