import type { ArticleContent, ArticleDocument } from './ai-translation.types'

export function toArticleContent(document: ArticleDocument): ArticleContent {
  return {
    title: document.title,
    text: document.text,
    summary: document.summary ?? undefined,
    tags: document.tags,
    contentFormat: document.contentFormat,
    content: document.content,
  }
}

export function readArticleMetaLang(document: {
  meta?: Record<string, unknown> | null
}): string | undefined {
  const lang = document.meta?.lang
  return typeof lang === 'string' ? lang : undefined
}
