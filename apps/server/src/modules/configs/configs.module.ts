import { Global, Module } from '@nestjs/common'

import { standardSchemaValidationPipeInstance } from '~/common/zod'
import { VALIDATION_PIPE_INJECTION } from '~/constants/system.constant'

import { ConfigsService } from './configs.service'
import { OptionsRepository } from './options.repository'

@Global()
@Module({
  providers: [
    ConfigsService,
    OptionsRepository,
    {
      provide: VALIDATION_PIPE_INJECTION,
      useValue: standardSchemaValidationPipeInstance,
    },
  ],
  exports: [ConfigsService, OptionsRepository],
})
export class ConfigsModule {}
