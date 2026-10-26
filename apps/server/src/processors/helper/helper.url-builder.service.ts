import { Injectable } from '@nestjs/common'
import { isNotNil } from 'es-toolkit'

import { ConfigsService } from '~/modules/configs/configs.service'
import type { PostModel } from '~/modules/post/post.types'
import {
  DEFAULT_POST_PERMALINK,
  joinWebUrl,
  type PermalinkPost,
  renderPostPermalink,
} from '~/utils/permalink.util'

@Injectable()
export class UrlBuilderService {
  constructor(private readonly configsService: ConfigsService) {}
  isPostModel(model: any): model is PostModel {
    return isNotNil(model.title) && isNotNil(model.slug)
  }

  build(model: PostModel, template = DEFAULT_POST_PERMALINK) {
    if (this.isPostModel(model)) {
      return renderPostPermalink(template, model)
    }

    return '/'
  }

  async buildWithBaseUrl(model: PostModel) {
    const { webUrl, postPermalink } = await this.urlConfig()
    return joinWebUrl(webUrl, this.build(model, postPermalink))
  }

  async createPostUrlResolver() {
    const { webUrl, postPermalink } = await this.urlConfig()
    const template = postPermalink || DEFAULT_POST_PERMALINK
    return (post: PermalinkPost) =>
      joinWebUrl(webUrl, renderPostPermalink(template, post))
  }

  private async urlConfig() {
    const { url } = await this.configsService.waitForConfigReady()
    return url
  }
}
