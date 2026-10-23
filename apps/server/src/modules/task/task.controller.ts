import { Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { CurrentUser } from '~/common/decorators/current-user.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { withMeta } from '~/common/response/envelope.types'
import { MetaObjectBuilder } from '~/common/response/meta-builder'
import { UserPermission } from '~/constants/permission.constant'
import type { SessionUser } from '~/modules/auth/auth.types'
import { TaskQueueService } from '~/processors/task-queue'
import { type StringIdDto, StringIdSchema } from '~/shared/dto/id.dto'
import { hasPermission } from '~/utils/permission.util'

import {
  type DeleteTasksQueryDto,
  DeleteTasksQuerySchema,
  type GetTasksQueryDto,
  GetTasksQuerySchema,
} from './task.dto'
import { permissionForTaskType } from './task-permission'

function assertCanControlTask(user: SessionUser, type: string) {
  if (!hasPermission(user, permissionForTaskType(type))) {
    throw createAppException(AppErrorCode.PERMISSION_DENIED)
  }
}

@ApiController('tasks')
@Auth()
export class TaskController {
  constructor(private readonly taskQueueService: TaskQueueService) {}

  private async assertCanControl(user: SessionUser, taskId: string) {
    const task = await this.taskQueueService.getTask(taskId)
    if (!task) {
      throw createAppException(AppErrorCode.TASK_NOT_FOUND, { id: taskId })
    }
    assertCanControlTask(user, task.type)
  }

  @Get('/')
  async getTasks(
    @Query({ schema: GetTasksQuerySchema }) query: GetTasksQueryDto,
  ) {
    const result = await this.taskQueueService.getTasks(query)
    return withMeta(
      result.data,
      new MetaObjectBuilder()
        .pagination({
          page: query.page,
          size: query.size,
          total: result.total,
          totalPages: Math.ceil(result.total / query.size),
        })
        .build(),
    )
  }

  @Get('/group/:id')
  async getTasksByGroupId(
    @Param({ schema: StringIdSchema }) params: StringIdDto,
  ) {
    return this.taskQueueService.getTasksByGroupId(params.id)
  }

  @Delete('/group/:id')
  async cancelTasksByGroupId(
    @CurrentUser() user: SessionUser,
    @Param({ schema: StringIdSchema }) params: StringIdDto,
  ) {
    const tasks = await this.taskQueueService.getTasksByGroupId(params.id)
    for (const task of tasks) assertCanControlTask(user, task.type)
    const cancelled = await this.taskQueueService.cancelTasksByGroupId(
      params.id,
    )
    return { cancelled }
  }

  @Get('/:id')
  async getTask(@Param({ schema: StringIdSchema }) params: StringIdDto) {
    const task = await this.taskQueueService.getTask(params.id)
    if (!task) {
      throw createAppException(AppErrorCode.TASK_NOT_FOUND, { id: params.id })
    }
    return task
  }

  @Post('/:id/cancel')
  @HttpCode(200)
  async cancelTask(
    @CurrentUser() user: SessionUser,
    @Param({ schema: StringIdSchema }) params: StringIdDto,
  ) {
    await this.assertCanControl(user, params.id)
    await this.taskQueueService.cancelTask(params.id)
    return { success: true }
  }

  @Post('/:id/retry')
  @HttpCode(200)
  async retryTask(
    @CurrentUser() user: SessionUser,
    @Param({ schema: StringIdSchema }) params: StringIdDto,
  ) {
    await this.assertCanControl(user, params.id)
    return this.taskQueueService.retryTask(params.id)
  }

  @Delete('/:id')
  @RequirePermissions(UserPermission.ManageSettings)
  async deleteTask(@Param({ schema: StringIdSchema }) params: StringIdDto) {
    await this.taskQueueService.deleteTask(params.id)
    return { success: true }
  }

  @Delete('/')
  @RequirePermissions(UserPermission.ManageSettings)
  async deleteTasks(
    @Query({ schema: DeleteTasksQuerySchema }) query: DeleteTasksQueryDto,
  ) {
    const deleted = await this.taskQueueService.deleteTasks(query)
    return { deleted }
  }
}
