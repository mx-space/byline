import type {
  InsightsMeta,
  PostResponseMeta,
  SummaryMeta,
  TtsMeta,
} from '~/common/response/meta.types'
import { PostResponseMetaSchema } from '~/common/response/meta.types'
import { MetaObjectBuilder } from '~/common/response/meta-builder'

export class PostMetaBuilder extends MetaObjectBuilder<
  typeof PostResponseMetaSchema
> {
  constructor() {
    super(PostResponseMetaSchema)
  }

  insights(value: InsightsMeta): this {
    ;(this.meta as PostResponseMeta).insights = value
    return this
  }

  summary(value: SummaryMeta): this {
    ;(this.meta as PostResponseMeta).summary = value
    return this
  }

  tts(value: TtsMeta): this {
    ;(this.meta as PostResponseMeta).tts = value
    return this
  }
}
