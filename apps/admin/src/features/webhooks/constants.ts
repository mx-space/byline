import { EventScope } from '~/api/webhooks'
import { adminQueryKeys } from '~/query/keys'

import type { WebhookCopyKey } from './copy'

export const webhooksQueryKey = adminQueryKeys.webhooks.root

export const dispatchPageSize = 20

export const scopeOptions: { labelKey: WebhookCopyKey; value: number }[] = [
  { labelKey: 'scopeVisitor', value: EventScope.TO_VISITOR },
  { labelKey: 'scopeAdmin', value: EventScope.TO_ADMIN },
  { labelKey: 'scopeSystem', value: EventScope.TO_SYSTEM },
]

const scopeValues = new Set<number>([1, 2, 3, 4, 5, 6, 7])

export function isWebhookScope(value: number) {
  return scopeValues.has(value)
}
