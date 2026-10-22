import type { SeoFieldsValue } from '~/features/write/components/PostBylineFields'
import type { PostSeo } from '~/models/post'

export function seoToFields(seo: PostSeo | null | undefined): SeoFieldsValue {
  return {
    seoDescription: seo?.description ?? '',
    seoImage: seo?.image ?? '',
    seoTitle: seo?.title ?? '',
  }
}

export function seoFromFields(fields: SeoFieldsValue): PostSeo | null {
  const seo: PostSeo = {}
  const title = fields.seoTitle.trim()
  const description = fields.seoDescription.trim()
  const image = fields.seoImage.trim()
  if (title) seo.title = title
  if (description) seo.description = description
  if (image) seo.image = image
  return Object.keys(seo).length ? seo : null
}
