import type { PublishAiResourceRequest } from '~/api/publish-jobs'

import type { Image, Pager } from './base'
import type { PostSeo } from './post'

export enum DraftRefType {
  Post = 'post',
}

export type RevisionRelation = 'same' | 'ancestor' | 'descendant' | 'diverged'

export interface RevisionSnapshot {
  content: string | null
  contentFormat: 'lexical' | 'markdown'
  images: Image[] | null
  meta: Record<string, unknown> | null
  text: string
  title: string
  typeSpecificData: TypeSpecificData | null
}

export interface ContentRevision extends RevisionSnapshot {
  createdAt: string
  documentId: string
  id: string
  parentRevisionId: string | null
}

export interface ContentDocument {
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
  relationToPublished: RevisionRelation | null
  status: 'active' | 'archived'
  updatedAt: string | null
}

export type DraftShareMode = 'follow' | 'pinned'

export interface DraftShare {
  createdAt: string
  documentId: string
  draftId: string | null
  id: string
  mode: DraftShareMode
  revisionId: string | null
  token: string
  updatedAt: string | null
}

export interface VersionContext {
  branches: DraftModel[]
  document: ContentDocument
  publishedRevision: ContentRevision | null
  versionTree: VersionTreeNode[]
}

export interface VersionTreeNode {
  branchBaseIds: string[]
  branchHeadIds: string[]
  collapsedRevisionCount: number
  parentNodeId: string | null
  publishedAt: string | null
  revision: ContentRevision
}

export interface RevisionComparison {
  commonAncestorRevisionId: string | null
  left: ContentRevision
  relation: RevisionRelation
  right: ContentRevision
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
