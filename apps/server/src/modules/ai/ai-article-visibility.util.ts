import { CollectionRefTypes } from '~/constants/db.constant'

import type { PostModel } from '../post/post.types'

type VisibilityArticle = { type: CollectionRefTypes; document: unknown }

export interface ArticleViewer {
  isOwner?: boolean
}

export function isArticleVisibleToViewer(
  article: VisibilityArticle,
  viewer: ArticleViewer,
): boolean {
  if (article.type !== CollectionRefTypes.Post) return false
  if (viewer.isOwner) return true
  return (article.document as PostModel).isPublished !== false
}

export function isGlobalArticleVisible(article: VisibilityArticle): boolean {
  return isArticleVisibleToViewer(article, {})
}
