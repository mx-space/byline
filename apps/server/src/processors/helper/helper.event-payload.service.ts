import { Injectable } from '@nestjs/common'

import { BusinessEvents } from '~/constants/business-event.constant'
import { PostService } from '~/modules/post/post.service'

@Injectable()
export class EventPayloadEnricherService {
  constructor(private readonly postService: PostService) {}

  async enrichPayload(event: BusinessEvents, data: any): Promise<any> {
    if (!data?.id) return data

    switch (event) {
      case BusinessEvents.POST_CREATE:
      case BusinessEvents.POST_UPDATE:
      case BusinessEvents.POST_REPUBLISH: {
        return (await this.postService.findById(data.id)) ?? data
      }
      default: {
        return data
      }
    }
  }
}
