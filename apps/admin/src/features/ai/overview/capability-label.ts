import type { AiOverviewCapability } from '~/api/ai-overview'

import type { AiCopyKey } from '../copy'

export const CAPABILITY_LABEL = {
  insights: 'tabInsights',
  summary: 'tabSummary',
  translation: 'tabTranslation',
  tts: 'tabTts',
} as const satisfies Record<AiOverviewCapability, AiCopyKey>

export const CAPABILITY_PATH = {
  insights: '/ai/insights',
  summary: '/ai/summary',
  translation: '/ai/translation',
  tts: '/ai/tts',
} as const satisfies Record<AiOverviewCapability, string>
