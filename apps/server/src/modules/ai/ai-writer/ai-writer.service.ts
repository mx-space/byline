import { Type } from '@earendil-works/pi-ai'
import { AI_PROMPTS } from '@mx-space/ai/prompts'
import { Injectable, Logger } from '@nestjs/common'

import { AI_FALLBACK_SLUG_MAX_LENGTH } from '../ai.constants'
import { AiService } from '../ai.service'

const SEO_DESCRIPTION_SOURCE_MAX_LENGTH = 12_000

const SEO_DESCRIPTION_SYSTEM_PROMPT = `You write the meta description a search engine shows under an article's title.
Write in the same language as the article.
Keep it to one or two sentences: at most 160 characters for alphabetic scripts, at most 80 characters for Chinese, Japanese or Korean.
State what the reader learns or gets from the article, naming its main subject and key terms.
Do not start with phrases such as "This article", do not use quotes, hashtags, emoji or a trailing ellipsis.`

const SeoDescriptionSchema = Type.Object({ description: Type.String() })

export interface SeoDescriptionSource {
  summary?: string | null
  text: string
  title: string
}

@Injectable()
export class AiWriterService {
  private readonly logger: Logger
  constructor(private readonly aiService: AiService) {
    this.logger = new Logger(AiWriterService.name)
  }

  private generateFallbackSlug(text: string): string {
    const slug = text
      .toLowerCase()
      .replaceAll(/[^\da-z]+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .slice(0, AI_FALLBACK_SLUG_MAX_LENGTH)

    return slug || 'untitled'
  }

  async generateTitleAndSlugByOpenAI(text: string) {
    const runtime = await this.aiService.getWriterModel()

    try {
      // No TaskExecuteContext available on this synchronous admin call — cost
      // capture intentionally omitted (call site is not task-queue driven).
      const { output } = await runtime.generateStructured({
        ...AI_PROMPTS.writer.titleAndSlug(text),
        temperature: 0.3,
        maxRetries: 2,
      })

      return output
    } catch (error) {
      this.logger.error(
        `Failed to generate title and slug: ${error.message}`,
        error.stack,
      )

      const fallbackTitle =
        text.slice(0, AI_FALLBACK_SLUG_MAX_LENGTH).trim() +
        (text.length > AI_FALLBACK_SLUG_MAX_LENGTH ? '...' : '')

      return {
        title: fallbackTitle,
        slug: this.generateFallbackSlug(fallbackTitle),
        lang: 'en',
        keywords: [],
      }
    }
  }

  async generateSlugByTitleViaOpenAI(title: string) {
    const runtime = await this.aiService.getWriterModel()

    try {
      // No TaskExecuteContext available on this synchronous admin call — cost
      // capture intentionally omitted (call site is not task-queue driven).
      const { output } = await runtime.generateStructured({
        ...AI_PROMPTS.writer.slug(title),
        temperature: 0.3,
        maxRetries: 2,
      })

      return output
    } catch (error) {
      this.logger.error(
        `Failed to generate slug from title: ${error.message}`,
        error.stack,
      )

      return {
        slug: this.generateFallbackSlug(title),
      }
    }
  }

  async generateSeoDescription(source: SeoDescriptionSource) {
    const runtime = await this.aiService.getWriterModel()
    const prompt = [
      `Title: ${source.title}`,
      source.summary ? `Author summary: ${source.summary}` : '',
      `Article:\n${source.text.slice(0, SEO_DESCRIPTION_SOURCE_MAX_LENGTH)}`,
    ]
      .filter(Boolean)
      .join('\n\n')
    const { output } = await runtime.generateStructured({
      systemPrompt: SEO_DESCRIPTION_SYSTEM_PROMPT,
      prompt,
      schema: SeoDescriptionSchema,
      maxRetries: 2,
      reasoningEffort: 'none',
    })
    return output.description.trim()
  }
}
