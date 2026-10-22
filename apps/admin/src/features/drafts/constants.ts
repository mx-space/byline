import type { LucideIcon } from 'lucide-react'
import { Code2 } from 'lucide-react'

import type { TranslationKey } from '~/i18n/types'
import type { DraftRefType } from '~/models/draft'
import { DraftRefType as DraftRefTypeValue } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import type { BadgeTone } from '~/ui/primitives/badge'

export const draftsQueryKey = adminQueryKeys.drafts.root

export const refTypeMeta: Record<
  DraftRefType,
  { icon: LucideIcon; labelKey: TranslationKey; tone: BadgeTone }
> = {
  [DraftRefTypeValue.Post]: {
    icon: Code2,
    labelKey: 'drafts.refType.post',
    tone: 'info',
  },
}
