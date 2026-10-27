import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'
import { ConfigsService } from '~/modules/configs/configs.service'
import type { ContentFormat } from '~/shared/types/content-format.type'
import { extractFileUrlsFromContent } from '~/utils/content.util'
import { S3Uploader } from '~/utils/s3.util'

import type { FileType } from './file.type'
import { FileReferenceRepository } from './file-reference.repository'
import {
  FileDeletionReason,
  type FileReferenceRow,
  FileReferenceStatus,
  FileReferenceType,
} from './file-reference.types'
import { FileReferenceUsageRepository } from './file-reference-usage.repository'
import {
  FILE_STORAGE_ROOT,
  resolveFileStorageRoot,
} from './file-storage.constants'
import { FileUsageRepository } from './file-usage.repository'

interface ContentLike {
  text: string | null
  contentFormat?: ContentFormat | string | null
  content?: string | null
  images?: unknown[] | null
  meta?: Record<string, unknown> | string | null
}

@Injectable()
export class FileReferenceService {
  private readonly logger = new Logger(FileReferenceService.name)
  private readonly storageRoot: string

  private isEnoent(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    )
  }

  private resolveLocalFileType(fileUrl: string): FileType | null {
    try {
      const pathname = new URL(fileUrl).pathname
      const match = pathname.match(
        /\/objects\/(icon|file|avatar|image|video)\//u,
      )
      return (match?.[1] as FileType | undefined) ?? null
    } catch {
      return null
    }
  }

  /**
   * Delete a local uploaded file. If it already does not exist on disk
   * (ENOENT), treat the cleanup as successful.
   */
  private async unlinkLocalFile(file: FileReferenceRow): Promise<boolean> {
    const type = this.resolveLocalFileType(file.fileUrl)
    if (!type) return false

    const basePath = path.resolve(this.storageRoot, type)
    const localPath = path.resolve(basePath, file.fileName)
    if (!localPath.startsWith(`${basePath}${path.sep}`)) return false

    try {
      await unlink(localPath)
    } catch (err) {
      if (this.isEnoent(err)) {
        return true
      }
      throw err
    }
    return true
  }

  constructor(
    private readonly fileReferenceRepository: FileReferenceRepository,
    private readonly configsService: ConfigsService,
    private readonly fileReferenceUsageRepository: FileReferenceUsageRepository,
    private readonly fileUsageRepository: FileUsageRepository,
    @Optional() @Inject(FILE_STORAGE_ROOT) storageRoot?: string,
  ) {
    this.storageRoot = storageRoot ?? resolveFileStorageRoot()
  }

  async createPendingReference(
    fileUrl: string,
    fileName: string,
    s3ObjectKey?: string,
  ) {
    const existing = await this.fileReferenceRepository.findFirstByUrl(fileUrl)
    if (existing) {
      return existing
    }

    return this.fileReferenceRepository.create({
      fileUrl,
      fileName,
      status: FileReferenceStatus.Pending,
      s3ObjectKey,
    })
  }

  async activateReferences(
    doc: ContentLike,
    refId: string,
    refType: FileReferenceType,
  ) {
    const fileUrls = extractFileUrlsFromContent(doc)
    if (fileUrls.length > 0) {
      await this.fileReferenceRepository.activateByUrls(
        fileUrls,
        refType,
        refId,
      )
    }
    await this.fileUsageRepository.replaceSourceUsages({
      fileUrls,
      sourceId: refId,
      sourceType: refType,
    })
  }

  async updateReferencesForDocument(
    doc: ContentLike,
    refId: string,
    refType: FileReferenceType,
  ) {
    const fileUrls = extractFileUrlsFromContent(doc)

    await this.fileReferenceRepository.markDocumentPending(refType, refId)

    if (fileUrls.length > 0) {
      for (const fileUrl of fileUrls) {
        await this.fileReferenceRepository.activateUrl(fileUrl, refType, refId)
      }
    }
    await this.fileUsageRepository.replaceSourceUsages({
      fileUrls,
      sourceId: refId,
      sourceType: refType,
    })
  }

  async removeReferencesForDocument(refId: string, refType: FileReferenceType) {
    await this.fileReferenceRepository.markDocumentPending(refType, refId)
    await this.fileUsageRepository.replaceSourceUsages({
      fileUrls: [],
      sourceId: refId,
      sourceType: refType,
    })
  }

  async findReferencesByUrls(urls: string[]) {
    return this.fileReferenceRepository.findByUrls(urls)
  }

  /**
   * Core hard-delete flow: remove the storage object first, then delete the
   * record. Deletion audits are emitted only as structured logs to stdout.
   */
  async hardDeleteFile(
    file: FileReferenceRow,
    reason: FileDeletionReason,
  ): Promise<{ storageRemoved: boolean }> {
    let storageRemoved = false
    let storageError: string | undefined

    try {
      if (file.s3ObjectKey) {
        const uploader = await this.buildS3Uploader()
        if (uploader) {
          await uploader.deleteObject(file.s3ObjectKey)
          storageRemoved = true
        } else {
          storageError = 'S3 not configured'
        }
      } else {
        storageRemoved = await this.unlinkLocalFile(file)
        if (!storageRemoved) storageError = 'unknown storage backend'
      }
    } catch (err) {
      storageError = err instanceof Error ? err.message : String(err)
    }

    await this.fileReferenceRepository.deleteById(file.id)

    const logPayload = {
      event: 'file_hard_delete',
      reason,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      s3ObjectKey: file.s3ObjectKey ?? null,
      byteSize: file.byteSize ?? null,
      refType: file.refType ?? null,
      refId: file.refId ?? null,
      storageRemoved,
      storageError: storageError ?? null,
    }
    if (storageError) {
      this.logger.warn(JSON.stringify(logPayload))
    } else {
      this.logger.log(JSON.stringify(logPayload))
    }
    return { storageRemoved }
  }

  // A file is deleted only when no persisted module contains its URL,
  // regardless of the representative refId/status.
  async cleanupOrphanFiles(maxAgeMinutes = 60) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000)

    const candidates =
      await this.fileReferenceRepository.findOlderThan(cutoffTime)
    const orphanFiles = await this.filterIsolatedFiles(candidates)

    const s3Uploader = await this.buildS3Uploader()
    let deletedCount = 0

    for (const file of orphanFiles) {
      try {
        if (file.s3ObjectKey) {
          if (!s3Uploader) {
            this.logger.warn(`S3 not configured, skip: ${file.fileName}`)
            continue
          }
          await s3Uploader.deleteObject(file.s3ObjectKey)
        } else if (!(await this.unlinkLocalFile(file))) {
          continue
        }
        await this.fileReferenceRepository.deleteById(file.id)
        deletedCount++
        this.logger.log(`Deleted orphan file: ${file.fileName}`)
      } catch {
        this.logger.warn(`Failed to delete orphan file: ${file.fileName}`)
      }
    }

    return { deletedCount, totalOrphan: orphanFiles.length }
  }

  async getFileReferences(fileUrl: string) {
    return this.fileReferenceRepository.findByUrl(fileUrl)
  }

  async getReferencesForDocument(refId: string, refType: FileReferenceType) {
    return (
      await this.fileReferenceRepository.findByRef(refType, refId)
    ).filter((row) => row.status === FileReferenceStatus.Active)
  }

  async getOrphanFilesCount() {
    return this.fileReferenceRepository.countOrphans()
  }

  async listOrphanFiles(page = 1, size = 20) {
    return this.fileReferenceRepository.listOrphans(page, size)
  }

  async listRemoteFiles(page = 1, size = 20) {
    return this.fileReferenceRepository.listRemote(page, size)
  }

  async deleteRemoteFile(id: string) {
    const file = await this.fileReferenceRepository.findById(id)
    if (!file?.s3ObjectKey) {
      throw createAppException(AppErrorCode.NOT_FOUND, { id })
    }
    const uploader = await this.buildS3Uploader()
    if (!uploader) {
      throw createAppException(AppErrorCode.FILE_STORAGE_NOT_CONFIGURED)
    }
    await uploader.deleteObject(file.s3ObjectKey)
    await this.fileReferenceRepository.deleteById(file.id)
    this.logger.log(
      JSON.stringify({
        event: 'file_hard_delete',
        reason: FileDeletionReason.Manual,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        s3ObjectKey: file.s3ObjectKey,
      }),
    )
  }

  async getReferenceById(id: string) {
    return this.fileReferenceRepository.findById(id)
  }

  async batchDeleteOrphans(options: { ids?: string[]; all?: boolean }) {
    const s3Uploader = await this.buildS3Uploader()

    const deleteFile = async (file: FileReferenceRow): Promise<boolean> => {
      if (file.s3ObjectKey) {
        if (!s3Uploader) return false
        await s3Uploader.deleteObject(file.s3ObjectKey)
        return true
      }
      return this.unlinkLocalFile(file)
    }

    if (options.all) {
      const candidates = await this.fileReferenceRepository.findAll()
      const orphanFiles = await this.filterIsolatedFiles(candidates)

      let deletedCount = 0
      for (const file of orphanFiles) {
        try {
          if (await deleteFile(file)) {
            await this.fileReferenceRepository.deleteById(file.id)
            deletedCount++
          }
        } catch {
          this.logger.warn(`Failed to delete orphan: ${file.fileName}`)
        }
      }
      return { deletedCount }
    }

    if (options.ids?.length) {
      const candidates = (
        await Promise.all(
          options.ids.map((id) => this.fileReferenceRepository.findById(id)),
        )
      ).filter((ref): ref is FileReferenceRow => !!ref)
      const orphanFiles = await this.filterIsolatedFiles(candidates)
      let deletedCount = 0
      for (const ref of orphanFiles) {
        try {
          if (await deleteFile(ref)) {
            await this.fileReferenceRepository.deleteById(ref.id)
            deletedCount++
          }
        } catch {
          this.logger.warn(`Failed to delete orphan: ${ref.fileName}`)
        }
      }
      return { deletedCount }
    }

    return { deletedCount: 0 }
  }

  private async filterIsolatedFiles(
    candidates: FileReferenceRow[],
  ): Promise<FileReferenceRow[]> {
    if (candidates.length === 0) return []
    const referencedUrls =
      await this.fileReferenceUsageRepository.findReferencedUrls(
        candidates.map((file) => file.fileUrl),
      )
    return candidates.filter((file) => !referencedUrls.has(file.fileUrl))
  }

  private async buildS3Uploader(): Promise<S3Uploader | null> {
    const config = await this.configsService.get('imageStorageOptions')
    if (
      !config.enable ||
      !config.endpoint ||
      !config.secretId ||
      !config.secretKey ||
      !config.bucket
    ) {
      return null
    }
    const uploader = new S3Uploader({
      endpoint: config.endpoint,
      accessKey: config.secretId,
      secretKey: config.secretKey,
      bucket: config.bucket,
      region: config.region || 'auto',
    })
    if (config.customDomain) {
      uploader.setCustomDomain(config.customDomain)
    }
    return uploader
  }
}
