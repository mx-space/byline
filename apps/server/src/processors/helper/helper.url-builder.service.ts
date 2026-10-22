import { URL } from 'node:url'

import { Injectable } from '@nestjs/common'
import { isNotNil } from 'es-toolkit'

import type { CategoryModel } from '~/modules/category/category.types'
import { ConfigsService } from '~/modules/configs/configs.service'
import type { PostModel } from '~/modules/post/post.types'

@Injectable()
export class UrlBuilderService {
  constructor(private readonly configsService: ConfigsService) {}
  isPostModel(model: any): model is PostModel {
    return isNotNil(model.title) && isNotNil(model.slug)
  }

  build(model: PostModel) {
    if (this.isPostModel(model)) {
      return `/posts/${
        (model.category as CategoryModel).slug
      }/${encodeURIComponent(model.slug)}`
    }

    return '/'
  }

  async buildWithBaseUrl(model: PostModel) {
    const {
      url: { webUrl: baseURL },
    } = await this.configsService.waitForConfigReady()

    return new URL(this.build(model), baseURL).href
  }
}
