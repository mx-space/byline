import { Module } from '@nestjs/common'

import { AiModule } from '../ai/ai.module'
import { AiTaskModule } from '../ai/ai-task/ai-task.module'
import { DraftModule } from '../draft/draft.module'
import { PostModule } from '../post/post.module'
import { PublishController } from './publish.controller'
import { PublishService } from './publish.service'

@Module({
  imports: [AiModule, AiTaskModule, DraftModule, PostModule],
  controllers: [PublishController],
  providers: [PublishService],
  exports: [PublishService],
})
export class PublishModule {}
