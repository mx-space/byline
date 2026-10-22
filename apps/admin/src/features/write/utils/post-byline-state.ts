import type { PostSpecificData } from '~/models/draft'
import type { PostModel, PostSeo } from '~/models/post'

export interface PostBylineState {
  authors: string[]
  image: string
  seoDescription: string
  seoImage: string
  seoTitle: string
  sourceLang: string
}

export const emptyPostBylineState: PostBylineState = {
  authors: [],
  image: '',
  seoDescription: '',
  seoImage: '',
  seoTitle: '',
  sourceLang: '',
}

function readAuthorIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const ids = value
    .map((item) =>
      item && typeof item === 'object' && 'id' in item
        ? String((item as { id: unknown }).id)
        : typeof item === 'string' || typeof item === 'number'
          ? String(item)
          : '',
    )
    .filter(Boolean)
  return [...new Set(ids)]
}

function seoToState(seo: PostSeo | null | undefined) {
  return {
    seoDescription: seo?.description ?? '',
    seoImage: seo?.image ?? '',
    seoTitle: seo?.title ?? '',
  }
}

export function postBylineFromModel(post: PostModel): PostBylineState {
  return {
    authors: readAuthorIds(post.authors) ?? [],
    image: post.image ?? '',
    sourceLang: post.sourceLang ?? '',
    ...seoToState(post.seo),
  }
}

export function postBylineFromSpecific(
  specific: Record<string, unknown>,
  previous: PostBylineState,
): PostBylineState {
  return {
    authors: readAuthorIds(specific.authors) ?? previous.authors,
    image:
      'image' in specific
        ? typeof specific.image === 'string'
          ? specific.image
          : ''
        : previous.image,
    sourceLang:
      'sourceLang' in specific
        ? typeof specific.sourceLang === 'string'
          ? specific.sourceLang
          : ''
        : previous.sourceLang,
    ...('seo' in specific
      ? seoToState(specific.seo as PostSeo | null)
      : {
          seoDescription: previous.seoDescription,
          seoImage: previous.seoImage,
          seoTitle: previous.seoTitle,
        }),
  }
}

export function postBylineToSpecific(
  state: PostBylineState,
): Pick<PostSpecificData, 'authors' | 'image' | 'seo' | 'sourceLang'> {
  const seo: PostSeo = {}
  if (state.seoTitle.trim()) seo.title = state.seoTitle.trim()
  if (state.seoDescription.trim()) seo.description = state.seoDescription.trim()
  if (state.seoImage.trim()) seo.image = state.seoImage.trim()

  return {
    ...(state.authors.length ? { authors: state.authors } : {}),
    image: state.image.trim() || null,
    seo: Object.keys(seo).length ? seo : null,
    sourceLang: state.sourceLang.trim() || null,
  }
}
