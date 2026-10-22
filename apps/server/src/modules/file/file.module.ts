import { Global, Module } from '@nestjs/common'

import { FileController } from './file.controller'
import { FileService } from './file.service'
import { FileReferenceRepository } from './file-reference.repository'
import { FileReferenceService } from './file-reference.service'
import { FileReferenceInventoryService } from './file-reference-inventory.service'
import { FileReferenceReconciliationService } from './file-reference-reconciliation.service'
import { FileReferenceUsageRepository } from './file-reference-usage.repository'
import { FileUsageRepository } from './file-usage.repository'

@Global()
@Module({
  controllers: [FileController],
  providers: [
    FileService,
    FileReferenceService,
    FileReferenceRepository,
    FileReferenceUsageRepository,
    FileUsageRepository,
    FileReferenceInventoryService,
    FileReferenceReconciliationService,
  ],
  exports: [FileService, FileReferenceService],
})
export class FileModule {}
