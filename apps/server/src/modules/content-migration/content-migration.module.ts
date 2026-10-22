import { Module } from '@nestjs/common'

import { AiModule } from '../ai/ai.module'
import { DraftModule } from '../draft/draft.module'
import { PostModule } from '../post/post.module'
import { ContentMigrationController } from './content-migration.controller'
import { ContentMigrationService } from './content-migration.service'

@Module({
  imports: [AiModule, DraftModule, PostModule],
  controllers: [ContentMigrationController],
  providers: [ContentMigrationService],
  exports: [ContentMigrationService],
})
export class ContentMigrationModule {}
