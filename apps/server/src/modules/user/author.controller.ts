import { Get, Param, Query } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { withMeta } from '~/common/response/envelope.types'
import { MetaObjectBuilder } from '~/common/response/meta-builder'

import {
  type AuthorIdentityDto,
  AuthorIdentitySchema,
  type AuthorListQueryDto,
  AuthorListQuerySchema,
} from './user.schema'
import { UserService } from './user.service'

@ApiController('authors')
export class AuthorController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async list(
    @Query({ schema: AuthorListQuerySchema }) query: AuthorListQueryDto,
  ) {
    const result = await this.userService.listAuthors(query)
    return withMeta(
      result.data,
      new MetaObjectBuilder().pagination(result.pagination).build(),
    )
  }

  @Get('/:idOrUsername')
  get(@Param({ schema: AuthorIdentitySchema }) params: AuthorIdentityDto) {
    return this.userService.getAuthor(params.idOrUsername)
  }
}
