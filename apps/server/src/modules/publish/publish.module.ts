import { Module } from '@nestjs/common'

import { AiTaskModule } from '../ai/ai-task/ai-task.module'
import { ContentMigrationModule } from '../content-migration/content-migration.module'
import { DraftModule } from '../draft/draft.module'
import { PostModule } from '../post/post.module'
import { PublishController } from './publish.controller'
import { PublishService } from './publish.service'

@Module({
  imports: [AiTaskModule, ContentMigrationModule, DraftModule, PostModule],
  controllers: [PublishController],
  providers: [PublishService],
  exports: [PublishService],
})
export class PublishModule {}
