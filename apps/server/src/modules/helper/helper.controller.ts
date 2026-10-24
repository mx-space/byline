import { Get, Param, Query, Res } from '@nestjs/common'
import type { FastifyReply } from 'fastify'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { HTTPDecorators } from '~/common/decorators/http.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { DatabaseService } from '~/processors/database/database.service'
import { UrlBuilderService } from '~/processors/helper/helper.url-builder.service'
import { type EntityIdDto, EntityIdSchema } from '~/shared/dto/id.dto'

@ApiController('helper')
export class HelperController {
  constructor(
    private readonly urlBulderService: UrlBuilderService,
    private readonly databaseService: DatabaseService,
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
}
