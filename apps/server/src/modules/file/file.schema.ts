import { z } from 'zod'

import { FileTypeEnum } from './file.type'

/**
 * File query schema
 */
export const FileQuerySchema = z.object({
  type: z.enum(FileTypeEnum),
  name: z.string(),
})

export type FileQueryDto = z.infer<typeof FileQuerySchema>

/**
 * File upload schema
 */
export const FileUploadSchema = z
  .object({
    type: z.enum(FileTypeEnum).optional(),
    immutable: z.literal('true').optional(),
  })
  .refine((value) => !value.immutable || !value.type || value.type === 'file', {
    error: 'Immutable uploads require type=file',
  })

export type FileUploadDto = z.infer<typeof FileUploadSchema>

/**
 * Rename file query schema
 */
export const RenameFileQuerySchema = z.object({
  newName: z.string(),
})

export type RenameFileQueryDto = z.infer<typeof RenameFileQuerySchema>

/**
 * Batch orphan delete schema
 */
export const BatchOrphanDeleteSchema = z
  .object({
    ids: z.array(z.string()).optional(),
    all: z.boolean().optional(),
  })
  .refine((data) => data.ids?.length || data.all, {
    error: 'Either ids or all must be provided',
  })

export type BatchOrphanDeleteDto = z.infer<typeof BatchOrphanDeleteSchema>

export const ReconcileFileReferencesSchema = z.object({
  apply: z.boolean().optional().default(false),
})

export type ReconcileFileReferencesDto = z.infer<
  typeof ReconcileFileReferencesSchema
>
