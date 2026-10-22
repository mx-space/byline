import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

import { RequestContext } from '~/common/contexts/request.context'
import { getNestExecutionContextRequest } from '~/transformers/get-req.transformer'
import { resolveRequestedLanguage } from '~/utils/lang.util'

// query.lang outranks the header-derived RequestContext.lang; writing it back
// keeps services that read RequestContext.currentLang() on the same locale
// as the controller.
export const Lang = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = getNestExecutionContextRequest(ctx)
    const query = request.query as Record<string, unknown>

    const resolved = resolveRequestedLanguage(
      query?.lang,
      RequestContext.currentLang(),
    )

    const ctxStore = RequestContext.currentRequestContext()
    if (ctxStore && resolved && ctxStore.lang !== resolved) {
      ctxStore.lang = resolved
    }

    return resolved
  },
)
