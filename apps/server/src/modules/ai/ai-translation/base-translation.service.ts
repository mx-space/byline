import { CollectionRefTypes } from '~/constants/db.constant'
import { computeContentHash as computeContentHashUtil } from '~/utils/content.util'

import type { PostModel } from '../../post/post.types'
import { isGlobalArticleVisible } from '../ai-article-visibility.util'
import type {
  ArticleContent,
  ArticleDocument,
  GlobalArticle,
} from './ai-translation.types'
import { readArticleMetaLang, toArticleContent } from './article-content.util'

export abstract class BaseTranslationService {
  toArticleContent(document: ArticleDocument): ArticleContent {
    return toArticleContent(document)
  }

  getMetaLang(document: {
    sourceLang?: string | null
    meta?: Record<string, unknown> | null
  }): string | undefined {
    return readArticleMetaLang(document)
  }

  computeContentHash(document: ArticleContent, sourceLang: string): string {
    return computeContentHashUtil(
      {
        title: document.title,
        text: document.text,
        subtitle: document.subtitle,
        contentFormat: document.contentFormat,
        content: document.content,
        summary: document.summary,
        tags: document.tags,
      },
      sourceLang,
    )
  }

  isPostArticle(
    article: GlobalArticle,
  ): article is { type: CollectionRefTypes.Post; document: PostModel } {
    return article.type === CollectionRefTypes.Post
  }

  isArticleVisible(article: GlobalArticle): boolean {
    return isGlobalArticleVisible(article)
  }
}
