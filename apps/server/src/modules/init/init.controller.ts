import { Body, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'

import { ConfigsService } from '../configs/configs.service'
import { type ConfigKeyDto, ConfigKeySchema } from '../option/option.schema'
import {
  type CreateFirstUserDto,
  CreateFirstUserSchema,
} from '../user/user.schema'
import { InitGuard } from './init.guard'
import { InitService } from './init.service'

@ApiController('/init')
@UseGuards(InitGuard)
export class InitController {
  constructor(
    private readonly configs: ConfigsService,
    private readonly initService: InitService,
  ) {}

  private async assertNotInitialized(forbiddenMode = false) {
    if (await this.initService.isInit()) {
      if (forbiddenMode) {
        throw createAppException(AppErrorCode.INIT_FORBIDDEN)
      }
      throw createAppException(AppErrorCode.INIT_ALREADY_COMPLETED)
    }
  }

  @Get('/')
  async isInit() {
    return {
      isInit: await this.initService.isInit(),
    }
  }

  @Get('/configs/default')
  async getDefaultConfig() {
    await this.assertNotInitialized(true)
    return this.configs.defaultConfig
  }

  @Patch('/configs/:key')
  async patch(
    @Param({ schema: ConfigKeySchema }) params: ConfigKeyDto,
    @Body() body: Record<string, any>,
  ) {
    await this.assertNotInitialized()
    if (typeof body !== 'object') {
      throw createAppException(AppErrorCode.INIT_INVALID_BODY)
    }
    return this.configs.patchAndValid(params.key, body)
  }

  @Post('/user')
  async createFirstUser(
    @Body({ schema: CreateFirstUserSchema }) body: CreateFirstUserDto,
  ) {
    await this.assertNotInitialized()
    return this.initService.createFirstUser(body)
  }
}
