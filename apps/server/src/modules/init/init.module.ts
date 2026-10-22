import { Module } from '@nestjs/common'

import { OptionModule } from '../option/option.module'
import { InitController } from './init.controller'
import { InitService } from './init.service'

@Module({
  providers: [InitService],
  exports: [InitService],
  controllers: [InitController],
  imports: [OptionModule],
})
export class InitModule {}
