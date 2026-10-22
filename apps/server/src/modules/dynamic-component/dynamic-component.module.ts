import { Module } from '@nestjs/common'

import { DynamicComponentController } from './dynamic-component.controller'
import { DynamicComponentRepository } from './dynamic-component.repository'
import { DynamicComponentService } from './dynamic-component.service'

@Module({
  providers: [DynamicComponentRepository, DynamicComponentService],
  controllers: [DynamicComponentController],
})
export class DynamicComponentModule {}
