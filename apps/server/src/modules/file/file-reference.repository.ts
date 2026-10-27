import { Inject, Injectable } from '@nestjs/common'
import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  lt,
  ne,
  notExists,
  or,
  sql,
} from 'drizzle-orm'

import { PG_DB_TOKEN } from '~/constants/system.constant'
import {
  aiTtsBlocks,
  dynamicComponents,
  fileReferences,
  fileUsages,
} from '~/database/schema'
import {
  BaseRepository,
  type PaginationResult,
  toEntityId,
} from '~/processors/database/base.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import { type EntityId, parseEntityId } from '~/shared/id/entity-id'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import {
  type FileReferenceRow,
  FileReferenceStatus,
  FileReferenceType,
} from './file-reference.types'

const mapRow = (row: typeof fileReferences.$inferSelect): FileReferenceRow => ({
  id: toEntityId(row.id) as EntityId,
  fileUrl: row.fileUrl,
  fileName: row.fileName,
  status: row.status as FileReferenceStatus,
  refId: row.refId ? (toEntityId(row.refId) as EntityId) : null,
  refType: (row.refType ?? null) as FileReferenceType | null,
  s3ObjectKey: row.s3ObjectKey,
  mimeType: row.mimeType ?? null,
  byteSize: row.byteSize ?? null,
  detachedAt: row.detachedAt ?? null,
  createdAt: row.createdAt,
})

@Injectable()
export class FileReferenceRepository extends BaseRepository {
  constructor(
    @Inject(PG_DB_TOKEN) db: AppDatabase,
    private readonly snowflake: SnowflakeService,
  ) {
    super(db)
  }

  private orphanWhere() {
    return and(
      notExists(
        this.db
          .select({ id: fileUsages.id })
          .from(fileUsages)
          .where(
            and(
              eq(fileUsages.fileReferenceId, fileReferences.id),
              // TTS usage is checked against its live block row below. A
              // reconciled usage row can otherwise outlive a deleted block.
              ne(fileUsages.sourceType, 'ai_tts'),
            ),
          ),
      ),
      // TTS blocks are written before the general reconciliation pass. Keep
      // newly generated narration out of the orphan list immediately, using
      // an exact URL match rather than the previous cross-table regex scan.
      notExists(
        this.db
          .select({ id: aiTtsBlocks.id })
          .from(aiTtsBlocks)
          .where(eq(aiTtsBlocks.url, fileReferences.fileUrl)),
      ),
      // Catalog modules are registered outside reconciliation as well, and a
      // superseded version stays live for posts that still point at it.
      notExists(
        this.db
          .select({ id: dynamicComponents.id })
          .from(dynamicComponents)
          .where(
            or(
              eq(dynamicComponents.url, fileReferences.fileUrl),
              eq(dynamicComponents.parentUrl, fileReferences.fileUrl),
              sql`${fileReferences.fileUrl} = ANY(${dynamicComponents.previousUrls})`,
            ),
          ),
      ),
    )!
  }

  async findById(id: EntityId | string): Promise<FileReferenceRow | null> {
    const idBig = parseEntityId(id)
    const [row] = await this.db
      .select()
      .from(fileReferences)
      .where(eq(fileReferences.id, idBig))
      .limit(1)
    return row ? mapRow(row) : null
  }

  async findByUrl(fileUrl: string): Promise<FileReferenceRow[]> {
    const rows = await this.db
      .select()
      .from(fileReferences)
      .where(eq(fileReferences.fileUrl, fileUrl))
    return rows.map(mapRow)
  }

  async findFirstByUrl(fileUrl: string): Promise<FileReferenceRow | null> {
    const [row] = await this.db
      .select()
      .from(fileReferences)
      .where(eq(fileReferences.fileUrl, fileUrl))
      .limit(1)
    return row ? mapRow(row) : null
  }

  async findByRef(
    refType: FileReferenceType,
    refId: EntityId | string,
  ): Promise<FileReferenceRow[]> {
    const rows = await this.db
      .select()
      .from(fileReferences)
      .where(
        and(
          eq(fileReferences.refType, refType),
          eq(fileReferences.refId, parseEntityId(refId)),
        )!,
      )
    return rows.map(mapRow)
  }

  async create(input: {
    fileUrl: string
    fileName: string
    status?: FileReferenceStatus
    refType?: FileReferenceType | null
    refId?: EntityId | string | null
    s3ObjectKey?: string | null
    mimeType?: string | null
    byteSize?: number | null
  }): Promise<FileReferenceRow> {
    const id = this.snowflake.nextId()
    const [row] = await this.db
      .insert(fileReferences)
      .values({
        id,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        status: input.status ?? FileReferenceStatus.Pending,
        refType: input.refType ?? null,
        refId: input.refId ? parseEntityId(input.refId) : null,
        s3ObjectKey: input.s3ObjectKey ?? null,
        mimeType: input.mimeType ?? null,
        byteSize: input.byteSize ?? null,
      })
      .returning()
    return mapRow(row)
  }

  async createPendingMany(
    files: Array<{ fileName: string; fileUrl: string }>,
  ): Promise<FileReferenceRow[]> {
    const created: FileReferenceRow[] = []
    const uniqueFiles = [
      ...new Map(files.map((file) => [file.fileUrl, file])).values(),
    ]

    for (let index = 0; index < uniqueFiles.length; index += 500) {
      const batch = uniqueFiles.slice(index, index + 500)
      if (batch.length === 0) continue
      const rows = await this.db
        .insert(fileReferences)
        .values(
          batch.map((file) => ({
            id: this.snowflake.nextId(),
            fileUrl: file.fileUrl,
            fileName: file.fileName,
            status: FileReferenceStatus.Pending,
          })),
        )
        .returning()
      created.push(...rows.map(mapRow))
    }

    return created
  }

  async setStatus(
    id: EntityId | string,
    status: FileReferenceStatus,
  ): Promise<FileReferenceRow | null> {
    const idBig = parseEntityId(id)
    const [row] = await this.db
      .update(fileReferences)
      .set({ status })
      .where(eq(fileReferences.id, idBig))
      .returning()
    return row ? mapRow(row) : null
  }

  async activateByUrls(
    fileUrls: string[],
    refType: FileReferenceType,
    refId: EntityId | string,
  ): Promise<number> {
    if (!fileUrls.length) return 0
    const result = await this.db
      .update(fileReferences)
      .set({
        status: FileReferenceStatus.Active,
        refType,
        refId: parseEntityId(refId),
      })
      .where(inArray(fileReferences.fileUrl, fileUrls))
      .returning({ id: fileReferences.id })
    return result.length
  }

  async markDocumentPending(
    refType: FileReferenceType,
    refId: EntityId | string,
  ): Promise<number> {
    const result = await this.db
      .update(fileReferences)
      .set({
        status: FileReferenceStatus.Pending,
        refId: null,
      })
      .where(
        and(
          eq(fileReferences.refType, refType),
          eq(fileReferences.refId, parseEntityId(refId)),
        )!,
      )
      .returning({ id: fileReferences.id })
    return result.length
  }

  async activateUrl(
    fileUrl: string,
    refType: FileReferenceType,
    refId: EntityId | string,
  ): Promise<FileReferenceRow | null> {
    const [row] = await this.db
      .update(fileReferences)
      .set({
        status: FileReferenceStatus.Active,
        refType,
        refId: parseEntityId(refId),
      })
      .where(eq(fileReferences.fileUrl, fileUrl))
      .returning()
    return row ? mapRow(row) : null
  }

  async listPending(
    page = 1,
    size = 20,
  ): Promise<PaginationResult<FileReferenceRow>> {
    page = Math.max(1, page)
    size = Math.min(100, Math.max(1, size))
    const offset = (page - 1) * size
    const where = eq(fileReferences.status, FileReferenceStatus.Pending)
    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(fileReferences)
        .where(where)
        .orderBy(desc(fileReferences.createdAt))
        .limit(size)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(fileReferences)
        .where(where),
    ])
    return {
      data: rows.map(mapRow),
      pagination: this.paginationOf(Number(count ?? 0), page, size),
    }
  }

  async findPendingOlderThan(threshold: Date): Promise<FileReferenceRow[]> {
    const rows = await this.db
      .select()
      .from(fileReferences)
      .where(
        and(
          eq(fileReferences.status, FileReferenceStatus.Pending),
          sql`${fileReferences.createdAt} < ${threshold}`,
        )!,
      )
    return rows.map(mapRow)
  }

  async findPending(): Promise<FileReferenceRow[]> {
    const rows = await this.db
      .select()
      .from(fileReferences)
      .where(eq(fileReferences.status, FileReferenceStatus.Pending))
    return rows.map(mapRow)
  }

  async countPending(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(fileReferences)
      .where(eq(fileReferences.status, FileReferenceStatus.Pending))
    return Number(row?.count ?? 0)
  }

  async deleteById(id: EntityId | string): Promise<FileReferenceRow | null> {
    const idBig = parseEntityId(id)
    const [row] = await this.db
      .delete(fileReferences)
      .where(eq(fileReferences.id, idBig))
      .returning()
    return row ? mapRow(row) : null
  }

  async findByUrls(fileUrls: string[]): Promise<FileReferenceRow[]> {
    if (!fileUrls.length) return []
    const rows = await this.db
      .select()
      .from(fileReferences)
      .where(inArray(fileReferences.fileUrl, fileUrls))
    return rows.map(mapRow)
  }

  async listOrphans(
    page = 1,
    size = 20,
  ): Promise<PaginationResult<FileReferenceRow>> {
    page = Math.max(1, page)
    size = Math.min(100, Math.max(1, size))
    const offset = (page - 1) * size
    const where = this.orphanWhere()
    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(fileReferences)
        .where(where)
        .orderBy(desc(fileReferences.createdAt))
        .limit(size)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(fileReferences)
        .where(where),
    ])
    return {
      data: rows.map(mapRow),
      pagination: this.paginationOf(Number(count ?? 0), page, size),
    }
  }

  async listRemote(
    page = 1,
    size = 20,
  ): Promise<PaginationResult<FileReferenceRow & { inUse: boolean }>> {
    page = Math.max(1, page)
    size = Math.min(100, Math.max(1, size))
    const offset = (page - 1) * size
    const where = isNotNull(fileReferences.s3ObjectKey)
    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select({
          row: fileReferences,
          inUse: sql<boolean>`not (${this.orphanWhere()})`,
        })
        .from(fileReferences)
        .where(where)
        .orderBy(desc(fileReferences.createdAt))
        .limit(size)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(fileReferences)
        .where(where),
    ])
    return {
      data: rows.map(({ row, inUse }) => ({ ...mapRow(row), inUse })),
      pagination: this.paginationOf(Number(count ?? 0), page, size),
    }
  }

  async countOrphans(): Promise<number> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(fileReferences)
      .where(this.orphanWhere())
    return Number(count ?? 0)
  }

  async findAll(): Promise<FileReferenceRow[]> {
    const rows = await this.db
      .select()
      .from(fileReferences)
      .orderBy(desc(fileReferences.createdAt))
    return rows.map(mapRow)
  }

  async findOlderThan(threshold: Date): Promise<FileReferenceRow[]> {
    const rows = await this.db
      .select()
      .from(fileReferences)
      .where(lt(fileReferences.createdAt, threshold))
      .orderBy(desc(fileReferences.createdAt))
    return rows.map(mapRow)
  }

  async deletePendingOlderThan(threshold: Date): Promise<number> {
    const result = await this.db
      .delete(fileReferences)
      .where(
        and(
          eq(fileReferences.status, FileReferenceStatus.Pending),
          sql`${fileReferences.createdAt} < ${threshold}`,
        )!,
      )
      .returning({ id: fileReferences.id })
    return result.length
  }
}
