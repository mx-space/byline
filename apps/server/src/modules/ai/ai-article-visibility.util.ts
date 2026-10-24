import { CollectionRefTypes } from '~/constants/db.constant'

import type { PostModel } from '../post/post.types'
import { isPostPublic } from '../post/post-visibility'

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
  return isPostPublic(article.document as PostModel)
}

export function isGlobalArticleVisible(article: VisibilityArticle): boolean {
  return isArticleVisibleToViewer(article, {})
}
