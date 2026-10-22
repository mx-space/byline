import { Injectable } from '@nestjs/common'

import { BusinessEvents } from '~/constants/business-event.constant'

import {
  ConfigVersionScopes,
  ConfigVersionService,
} from './config-version.service'

export const PUBLIC_CONTENT_EVENTS: ReadonlySet<string> = new Set([
  BusinessEvents.POST_CREATE,
  BusinessEvents.POST_UPDATE,
  BusinessEvents.POST_UNPUBLISH,
  BusinessEvents.POST_REPUBLISH,
  BusinessEvents.POST_DELETE,
  BusinessEvents.CATEGORY_CREATE,
  BusinessEvents.CATEGORY_UPDATE,
  BusinessEvents.CATEGORY_DELETE,
  BusinessEvents.TRANSLATION_CREATE,
  BusinessEvents.TRANSLATION_UPDATE,
  BusinessEvents.TRANSLATION_DELETE,
  BusinessEvents.INSIGHTS_CREATE,
  BusinessEvents.INSIGHTS_UPDATE,
  BusinessEvents.INSIGHTS_DELETE,
  BusinessEvents.INSIGHTS_GENERATED,
  BusinessEvents.SUMMARY_GENERATED,
  BusinessEvents.CONTENT_REFRESH,
])

// Public responses are keyed by a shared generation instead of being deleted
// one by one: a read that started before a write can only refill the retired
// generation, so it can never put stale data back in front of later readers.
@Injectable()
export class ApiCacheService {
  constructor(private readonly configVersion: ConfigVersionService) {}

  generation() {
    return this.configVersion.getVersion(ConfigVersionScopes.PublicContent)
  }

  async invalidate() {
    await this.configVersion.bump(ConfigVersionScopes.PublicContent)
  }
}
