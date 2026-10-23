import { describe, expect, test, vi } from 'vitest'

import { apiRoutePrefix } from '~/common/decorators/api-controller.decorator'
import { UserPermission } from '~/constants/permission.constant'
import { CONTENT_PUBLISH_TASK } from '~/modules/publish/publish.types'
import { TaskController } from '~/modules/task/task.controller'
import { TaskQueueService } from '~/processors/task-queue'

import { createE2EApp } from '../../helper/create-e2e-app'
import { authPassHeader } from '../../mock/guard/auth.guard'

const queue = {
  cancelTask: vi.fn(async () => true),
  cancelTasksByGroupId: vi.fn(async () => 1),
  getTask: vi.fn(async () => ({ id: 't1', type: CONTENT_PUBLISH_TASK })),
  getTasksByGroupId: vi.fn(async () => [
    { id: 't1', type: CONTENT_PUBLISH_TASK },
  ]),
  retryTask: vi.fn(async () => ({ taskId: 't2' })),
}

describe('TaskController task permissions (e2e)', () => {
  const proxy = createE2EApp({
    controllers: [TaskController],
    providers: [{ provide: TaskQueueService, useValue: queue }],
  })
  const author = {
    ...authPassHeader,
    'test-permissions': String(
      UserPermission.EditPost | UserPermission.ManageFiles,
    ),
  }

  test.each([
    ['POST', '/tasks/t1/retry', 'retryTask'],
    ['POST', '/tasks/t1/cancel', 'cancelTask'],
    ['DELETE', '/tasks/group/g1', 'cancelTasksByGroupId'],
  ] as const)(
    '%s %s on a publish task needs PublishPost',
    async (method, url, call) => {
      queue[call].mockClear()
      const res = await proxy.app.inject({
        headers: author,
        method,
        url: `${apiRoutePrefix}${url}`,
      })
      expect(res.statusCode).toBe(403)
      expect(queue[call]).not.toHaveBeenCalled()
    },
  )

  test('an owner can still retry', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'POST',
      url: `${apiRoutePrefix}/tasks/t1/retry`,
    })
    expect(res.statusCode).toBe(200)
    expect(queue.retryTask).toHaveBeenCalledWith('t1')
  })
})
