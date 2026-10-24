import type { AITask } from '~/api/tasks'

export function formatTaskClock(timestamp?: number) {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '--'
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function taskElapsedMs(
  task: Pick<AITask, 'completedAt' | 'startedAt'>,
  now: number,
): number | null {
  if (!task.startedAt) return null
  const end = task.completedAt ?? now
  const ms = end - task.startedAt
  return ms >= 0 ? ms : null
}

export function formatElapsed(ms: number | null) {
  if (ms === null) return '--'
  if (ms < 1000) return `${ms} ms`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  if (minutes < 60)
    return remain ? `${minutes} min ${remain} s` : `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${minutes % 60} min`
}
