import type {
  FileReferenceStatus,
  FileReferenceType,
} from './file-reference.enum'

export { FileReferenceStatus, FileReferenceType } from './file-reference.enum'

export enum FileDeletionReason {
  PendingTtl = 'pending_ttl',
  DetachedTtl = 'detached_ttl',
  CascadePostDeleted = 'cascade_post_deleted',
  Manual = 'manual',
}

export interface FileReferenceRow {
  id: string
  fileUrl: string
  fileName: string
  status: FileReferenceStatus
  refId: string | null
  refType: FileReferenceType | null
  s3ObjectKey: string | null
  mimeType: string | null
  byteSize: number | null
  detachedAt: Date | null
  createdAt: Date
}
