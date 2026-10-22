import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { BusinessEvents } from '~/constants/business-event.constant'

import { AiTranslationService } from './ai-translation.service'
import type { ArticleEventPayload } from './ai-translation.types'
import { TranslationEntryService } from './translation-entry.service'

interface CategoryEventPayload {
  id: string
  name?: string
}

@Injectable()
export class AiTranslationEventHandlerService {
  constructor(
    private readonly aiTranslationService: AiTranslationService,
    private readonly translationEntryService: TranslationEntryService,
  ) {}

  @OnEvent(BusinessEvents.POST_DELETE)
  async handleDeleteArticle(event: ArticleEventPayload) {
    const id = this.aiTranslationService.extractIdFromEvent(event)
    if (!id) return
    await this.aiTranslationService.deleteTranslationsByRefId(id)
  }

  @OnEvent(BusinessEvents.CATEGORY_UPDATE)
  async handleCategoryUpdate(event: CategoryEventPayload) {
    if (!event.id || !event.name) return
    await this.translationEntryService.handleEntityUpdate(
      'category.name',
      event.id,
      event.name,
    )
  }

  @OnEvent(BusinessEvents.CATEGORY_DELETE)
  async handleCategoryDelete(event: { id: string }) {
    if (!event.id) return
    await this.translationEntryService.deleteByKeyPath(
      'category.name',
      event.id,
    )
  }
}
