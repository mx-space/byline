import type { PublishAiResourceRequest } from '~/api/publish-jobs'

import type { Image, Pager } from './base'
import type { PostSeo } from './post'

export enum DraftRefType {
  Post = 'post',
}

export type RevisionRelation = 'same' | 'ancestor' | 'descendant' | 'diverged'

export type DraftRelation = 'ahead' | 'fresh' | 'in_sync'

export interface CrdtOpId {
  counter: number
  peer: `${number}`
}

export type CheckpointKind =
  'import' | 'legacy-save' | 'publish' | 'restore' | 'save' | 'undo'

export interface RevisionSnapshot {
  content: string | null
  contentFormat: 'lexical'
  images: Image[] | null
  meta: Record<string, unknown> | null
  text: string
  title: string
  typeSpecificData: TypeSpecificData | null
}

export interface ContentRevision extends RevisionSnapshot {
  createdAt: string
  documentId: string
  frontiers?: CrdtOpId[] | null
  id: string
  kind?: CheckpointKind | null
  parentRevisionId: string | null
}

export type DraftCheckpoint = Pick<
  ContentRevision,
  | 'contentFormat'
  | 'createdAt'
  | 'frontiers'
  | 'id'
  | 'kind'
  | 'parentRevisionId'
  | 'title'
>

export interface DraftChange {
  deps: CrdtOpId[]
  id: CrdtOpId
  lamport: number
  message?: string
  timestamp: number
}

export interface DraftHistory {
  changes: DraftChange[]
  checkpoints: DraftCheckpoint[]
}

export interface DraftFields {
  meta: Record<string, unknown> | null
  typeSpecificData: Record<string, unknown> | null
}

export interface ContentDocument {
  aiSeo?: { description: string; sourceHash: string } | null
  createdAt: string
  id: string
  publishAiResources?: PublishAiResourceRequest[] | null
  publishedRevisionId: string | null
  refId: string | null
  refType: DraftRefType
  updatedAt: string | null
}

export interface DraftModel {
  baseRevision: ContentRevision
  baseRevisionId: string
  commonAncestorRevisionId: string | null
  createdAt: string
  document: ContentDocument
  documentId: string
  headRevision: ContentRevision
  headRevisionId: string
  id: string
  publishedRevision: ContentRevision | null
  relation: DraftRelation
  relationToPublished: RevisionRelation | null
  status: 'active' | 'archived'
  updatedAt: string | null
}

export interface VersionContext {
  branches: DraftModel[]
  document: ContentDocument
  publishedRevision: ContentRevision | null
}

export interface DraftResponse {
  data: DraftModel[]
  pagination: Pager
}

export interface PostSpecificData {
  publicAt?: string | null
  authors?: Array<string | { id: string }>
  categoryId?: string
  created?: string
  image?: string | null
  pin?: boolean | string | null
  pinOrder?: number
  seo?: PostSeo | null
  slug?: string
  sourceLang?: string | null
  summary?: string | null
  tags?: string[]
}

export type TypeSpecificData = PostSpecificData
