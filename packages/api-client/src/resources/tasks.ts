import { BylineApiError } from '../error'
import type { HttpCore } from '../http'
import type {
  CreatePublishJobInput,
  PublishTaskResult,
  Task,
  TaskRef,
  TaskStatus,
} from '../types'

const TERMINAL: ReadonlySet<TaskStatus> = new Set([
  'completed',
  'partial_failed',
  'failed',
  'cancelled',
])

export interface WaitForTaskOptions {
  intervalMs?: number
  timeoutMs?: number
  signal?: AbortSignal
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })

export class TasksResource {
  constructor(private readonly http: HttpCore) {}

  get<TResult = unknown>(id: string) {
    return this.http.request<Task<TResult>>('GET', `/tasks/${id}`)
  }

  cancel(id: string) {
    return this.http.request<void>('POST', `/tasks/${id}/cancel`)
  }

  async wait<TResult = unknown>(
    id: string,
    options: WaitForTaskOptions = {},
  ): Promise<Task<TResult>> {
    const intervalMs = options.intervalMs ?? 500
    const deadline = Date.now() + (options.timeoutMs ?? 120_000)
    for (;;) {
      const { data } = await this.get<TResult>(id)
      if (TERMINAL.has(data.status)) return data
      if (Date.now() > deadline) {
        throw new BylineApiError(
          408,
          'TASK_TIMEOUT',
          `Task ${id} did not finish in time (last status: ${data.status})`,
          `/tasks/${id}`,
        )
      }
      await sleep(intervalMs, options.signal)
    }
  }
}

export class PublishJobsResource {
  constructor(
    private readonly http: HttpCore,
    private readonly tasks: TasksResource,
  ) {}

  create(input: CreatePublishJobInput) {
    return this.http.request<TaskRef>('POST', '/publish-jobs', { body: input })
  }

  async run(input: CreatePublishJobInput, options?: WaitForTaskOptions) {
    const { data: ref } = await this.create(input)
    const task = await this.tasks.wait<PublishTaskResult>(ref.taskId, options)
    if (task.status !== 'completed' || !task.result?.articleId) {
      throw new BylineApiError(
        500,
        'PUBLISH_FAILED',
        `Publish job ${ref.taskId} ended with ${task.status}${task.error ? `: ${task.error}` : ''}`,
        '/publish-jobs',
        { task },
      )
    }
    return task as Task<PublishTaskResult> & { result: PublishTaskResult }
  }
}
