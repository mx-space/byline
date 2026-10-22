import { Body, HttpCode, Post } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'

import {
  AiQueryType,
  type GenerateAiDto,
  GenerateAiSchema,
} from './ai-writer.schema'
import { AiWriterService } from './ai-writer.service'

@ApiController('ai/writer')
export class AiWriterController {
  constructor(private readonly aiWriterService: AiWriterService) {}

  @Post('generate')
  @HttpCode(200)
  @Auth()
  async generate(@Body({ schema: GenerateAiSchema }) body: GenerateAiDto) {
    switch (body.type) {
      case AiQueryType.TitleSlug: {
        return this.aiWriterService.generateTitleAndSlugByOpenAI(body.text!)
      }
      case AiQueryType.Slug: {
        return this.aiWriterService.generateSlugByTitleViaOpenAI(body.title!)
      }
      default: {
        throw createAppException(AppErrorCode.AI_INVALID_QUERY_TYPE)
      }
    }
  }
}
