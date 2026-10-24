import { UserPermission } from '~/constants/permission.constant'
import { AITaskType } from '~/modules/ai/ai-task/ai-task.types'
import { CONTENT_PUBLISH_TASK } from '~/modules/publish/publish.types'
import { permissionForTaskType } from '~/modules/task/task-permission'

describe('permissionForTaskType', () => {
  it('asks for the bit that started the task', () => {
    expect(permissionForTaskType(CONTENT_PUBLISH_TASK)).toBe(
      UserPermission.PublishPost,
    )
    expect(permissionForTaskType(AITaskType.Translation)).toBe(
      UserPermission.EditTranslation,
    )
    expect(permissionForTaskType(AITaskType.TranslationAll)).toBe(
      UserPermission.EditTranslation,
    )
    expect(permissionForTaskType(AITaskType.Summary)).toBe(
      UserPermission.EditPost,
    )
    expect(permissionForTaskType(AITaskType.Tts)).toBe(UserPermission.EditPost)
  })

  it('falls back to ManageSettings for anything else', () => {
    expect(permissionForTaskType('cron:clean-temp-directory')).toBe(
      UserPermission.ManageSettings,
    )
    expect(permissionForTaskType('unknown')).toBe(UserPermission.ManageSettings)
  })
})
