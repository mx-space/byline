import type { CollectionRefTypes } from '~/constants/db.constant'
import type { EntityId } from '~/shared/id/entity-id'

import type { PostModel } from '../../post/post.types'
import type { GenerationMetricsDto } from '../ai-generation-metrics/ai-generation-metrics.types'
import type { TranslationEntryKeyPath } from './translation-entry.types'

export interface ArticleContent {
  title: string
  text: string
  subtitle?: string | null
  summary?: string | null
  tags?: string[]
  meta?: { lang?: string }
  contentFormat?: string | null
  content?: string | null
}

export type ArticleDocument = PostModel

export type ArticleEventDocument = ArticleDocument

export type ArticleEventPayload =
  ArticleEventDocument | { data: string } | { id: string }

export type GlobalArticle = {
  document: PostModel
  type: CollectionRefTypes.Post
}

export interface AiTranslationRow {
  id: EntityId
  hash: string
  refId: EntityId
  refType: string
  lang: string
  sourceLang: string
  title: string
  text: string
  subtitle: string | null
  summary: string | null
  tags: string[]
  sourceModifiedAt: Date | null
  aiModel: string | null
  aiProvider: string | null
  contentFormat: string | null
  content: string | null
  sourceBlockSnapshots: unknown
  sourceMetaHashes: unknown
  createdAt: Date
  updatedAt: Date | null
  generationMetrics?: GenerationMetricsDto | null
}

export interface AiTranslationRevision {
  createdAt: Date
  updatedAt: Date | null
}

export interface TranslationEntryRow {
  id: EntityId
  keyPath: TranslationEntryKeyPath
  lang: string
  keyType: string
  lookupKey: string
  sourceText: string
  translatedText: string
  sourceUpdatedAt: Date | null
  createdAt: Date
}
