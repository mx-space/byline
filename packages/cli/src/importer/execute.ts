import path from 'node:path'

import {
  type BylineClient,
  isBylineApiError,
  type Post,
  type PostWriteInput,
} from '@mx-space/byline-api-client'

import { AssetUploader, findLocalAssets } from './assets'
import type { ImportConfig } from './config'
import type { PlannedPost } from './plan'
import { AuthorResolver, CategoryResolver, type ResolvedRef } from './resolvers'

export type PostAction = 'create' | 'update' | 'unchanged' | 'skip' | 'error'

export interface PostOutcome {
  key: string
  slug: string
  action: PostAction
  postId?: string
  translations: number
  localAssets: number
  authors: string[]
  message?: string
}

export interface ExecuteOptions {
  root: string
  client: BylineClient | null
  dryRun: boolean
  force?: boolean
  preserveDates?: boolean
  onProgress?: (outcome: PostOutcome) => void
}

export interface ExecuteResult {
  outcomes: PostOutcome[]
  authors: ResolvedRef[]
  categories: ResolvedRef[]
}

export const IMPORT_META_KEY = 'bylineImport'

interface ImportMeta {
  source: string
  hash: string
}

const readImportMeta = (post: Post | null): ImportMeta | undefined => {
  const value = post?.meta?.[IMPORT_META_KEY]
  return value && typeof value === 'object' ? (value as ImportMeta) : undefined
}

const findExisting = async (client: BylineClient, slug: string) => {
  const found = await client.posts.findBySlug(slug)
  return found?.data ?? null
}

export const executeImport = async (
  plan: PlannedPost[],
  config: ImportConfig,
  options: ExecuteOptions,
): Promise<ExecuteResult> => {
  const { client, dryRun } = options
  if (!client && !dryRun) throw new Error('An API client is required to import')
  const authors = new AuthorResolver(client, config.authors, dryRun)
  const categories = new CategoryResolver(client, config.categories, dryRun)
  const uploader = client && !dryRun ? new AssetUploader(client) : null
  const outcomes: PostOutcome[] = []

  for (const post of plan) {
    const localAssets =
      (post.document ? findLocalAssets(post.document.state).length : 0) +
      post.translations.reduce(
        (sum, item) => sum + findLocalAssets(item.document.state).length,
        0,
      )
    const outcome: PostOutcome = {
      key: post.key,
      slug: post.slug,
      action: 'skip',
      translations: post.translations.length,
      localAssets,
      authors: post.authorKeys,
    }
    outcomes.push(outcome)
    if (post.skipReason || !post.document || !post.title || !post.category) {
      outcome.message = post.skipReason
      options.onProgress?.(outcome)
      continue
    }

    try {
      const [authorRefs, category] = await Promise.all([
        Promise.all(post.authorKeys.map((key) => authors.resolve(key))),
        categories.resolve(post.category),
      ])
      const existing = client ? await findExisting(client, post.slug) : null
      outcome.postId = existing?.id
      const previous = readImportMeta(existing)
      if (existing && previous?.hash === post.hash && !options.force) {
        outcome.action = 'unchanged'
        options.onProgress?.(outcome)
        continue
      }
      outcome.action = existing ? 'update' : 'create'
      if (dryRun || !client || !uploader) {
        options.onProgress?.(outcome)
        continue
      }

      const baseDir = path.dirname(path.resolve(options.root, post.sourceFile!))
      const authorIds = [
        ...new Set(authorRefs.map((ref) => ref.id).filter(Boolean)),
      ] as string[]
      const image = post.image
        ? await uploader.resolveUrl(post.image, baseDir)
        : null
      const input: PostWriteInput = {
        title: post.title,
        content: await uploader.rewrite(post.document.state, baseDir),
        text: post.document.markdown,
        slug: post.slug,
        categoryId: category.id,
        summary: post.summary ?? null,
        tags: post.tags,
        ...(authorIds.length ? { authors: authorIds } : {}),
        sourceLang: post.sourceLocale,
        image,
        seo: post.seo ?? null,
        meta: {
          ...existing?.meta,
          [IMPORT_META_KEY]: { source: post.sourceFile!, hash: post.hash },
        },
        ...(options.preserveDates && post.createdAt
          ? { createdAt: post.createdAt }
          : {}),
      }
      const saveOptions = { aiResources: [], timeoutMs: 300_000 }
      const saved = existing
        ? await client.posts.revise(existing.id, input, saveOptions)
        : await client.posts.create(input, saveOptions)
      const postId = saved.postId!
      outcome.postId = postId

      for (const translation of post.translations) {
        await client.translations.writeManual(postId, translation.locale, {
          title: translation.title,
          content: await uploader.rewrite(translation.document.state, baseDir),
          text: translation.document.markdown,
          summary: translation.summary ?? null,
          tags: translation.tags,
          sourceLang: post.sourceLocale,
        })
      }
    } catch (error) {
      outcome.action = 'error'
      outcome.message = isBylineApiError(error)
        ? `${error.code}: ${error.message}`
        : (error as Error).message
    }
    options.onProgress?.(outcome)
  }

  return {
    outcomes,
    authors: await authors.all,
    categories: await categories.all,
  }
}
