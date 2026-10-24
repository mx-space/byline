import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { CronExpression } from '@nestjs/schedule'

import { CronOnce } from '~/common/decorators/cron-once.decorator'
import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import { EventManagerService } from '~/processors/helper/helper.event.service'

import { PostRepository } from './post.repository'

@Injectable()
export class PostPublicationScheduler implements OnApplicationBootstrap {
  constructor(
    private readonly posts: PostRepository,
    private readonly events: EventManagerService,
  ) {}

  onApplicationBootstrap() {
    return this.announceDuePublications()
  }

  @CronOnce(CronExpression.EVERY_10_SECONDS, { name: 'publishScheduledPosts' })
  async announceDuePublications() {
    return this.posts.dispatchDuePublications(async (due) => {
      for (const post of due) {
        await this.events.emit(BusinessEvents.POST_REPUBLISH, post, {
          scope: EventScope.ALL,
        })
      }
    })
  }
}
