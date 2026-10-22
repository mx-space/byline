import { Module } from '@nestjs/common'

import { CronBusinessService } from './cron-business.service'
import { CronDefinitionController } from './cron-task.controller'
import { CronTaskScheduler } from './cron-task.scheduler'
import { CronTaskService } from './cron-task.service'

@Module({
  controllers: [CronDefinitionController],
  providers: [CronBusinessService, CronTaskService, CronTaskScheduler],
  exports: [CronTaskService, CronBusinessService],
})
export class CronTaskModule {}
