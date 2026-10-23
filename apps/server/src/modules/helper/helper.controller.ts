import { Get, HttpCode, Param, Post, Query, Res } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import type { FastifyReply } from 'fastify'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { HTTPDecorators } from '~/common/decorators/http.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { UserPermission } from '~/constants/permission.constant'
import { DatabaseService } from '~/processors/database/database.service'
import { ImageService } from '~/processors/helper/helper.image.service'
import { UrlBuilderService } from '~/processors/helper/helper.url-builder.service'
import { type EntityIdDto, EntityIdSchema } from '~/shared/dto/id.dto'
import { isLexical } from '~/utils/content.util'
import { AsyncQueue } from '~/utils/queue.util'

import { PostService } from '../post/post.service'

@ApiController('helper')
export class HelperController {
  constructor(
    private readonly urlBulderService: UrlBuilderService,
    private readonly databaseService: DatabaseService,
    private readonly moduleRef: ModuleRef,
  ) {}

  @Get('/url-builder/:id')
  @HTTPDecorators.RawResponse
  async builderById(
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Query('redirect') redirect: boolean,
    @Res() res: FastifyReply,
  ) {
    const doc = await this.databaseService.findGlobalById(params.id)
    if (!doc) {
      if (redirect) {
        throw createAppException(AppErrorCode.HELPER_DOCUMENT_NOT_FOUND, {
          id: params.id,
        })
      }

      res.send(null)
      return
    }

    const url = await this.urlBulderService.buildWithBaseUrl(doc.document)

    if (redirect) {
      res.status(301).redirect(url)
    } else {
      res.send({ data: url })
    }
  }

  @Post('/refresh-images')
  @HttpCode(200)
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  async refreshImages() {
    const postService = this.moduleRef.get(PostService, { strict: false })
    const imageService = this.moduleRef.get(ImageService, { strict: false })
    const posts = await postService.findRecent(50)

    const q = new AsyncQueue(10)
    q.addMultiple(
      posts
        .filter((doc) => !isLexical(doc))
        .map(
          (doc) => () =>
            imageService.saveImageDimensionsFromMarkdownText(
              doc.text,
              doc.images,
              (images) => {
                doc.images = images
                return postService.updateById(doc.id, { images } as any)
              },
            ),
        ),
    )
  }
}
