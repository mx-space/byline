import type {
  PublishAiResource,
  PublishAiResourceRequest,
} from '~/api/publish-jobs'
import type { TranslationKey } from '~/i18n/types'

export type PublishAiChoice = 'none' | 'sync' | 'async'
export type ModalPublishAiResource = Exclude<PublishAiResource, 'seo'>
export type PublishAiChoices = Record<ModalPublishAiResource, PublishAiChoice>

export const publishAiResourceOrder: ModalPublishAiResource[] = [
  'summary',
  'insights',
  'translation',
  'tts',
]

export const publishAiResourceLabels: Record<
  PublishAiResource,
  TranslationKey
> = {
  insights: 'ai.overview.capability.insights',
  seo: 'write.publishAi.seo',
  summary: 'ai.overview.capability.summary',
  translation: 'ai.overview.capability.translation',
  tts: 'ai.overview.capability.tts',
}

export const emptyPublishAiChoices = (): PublishAiChoices => ({
  insights: 'none',
  summary: 'none',
  translation: 'none',
  tts: 'none',
})

export function choicesFromRequests(
  requests: readonly PublishAiResourceRequest[] | null | undefined,
): PublishAiChoices {
  const choices = emptyPublishAiChoices()
  for (const { mode, resource } of requests ?? []) {
    if (resource !== 'seo' && resource in choices) choices[resource] = mode
  }
  return choices
}

export function toPublishAiRequests(
  choices: PublishAiChoices,
  isAvailable: (resource: PublishAiResource) => boolean,
  generateSeo = false,
): PublishAiResourceRequest[] {
  const seo: PublishAiResourceRequest[] =
    generateSeo && isAvailable('seo') ? [{ mode: 'sync', resource: 'seo' }] : []
  return [
    ...seo,
    ...publishAiResourceOrder.flatMap((resource) => {
      const choice = choices[resource]
      if (choice === 'none' || !isAvailable(resource)) return []
      return [{ mode: choice, resource }]
    }),
  ]
}

export function normalizeTaskAiResources(
  resources: ReadonlyArray<PublishAiResource | PublishAiResourceRequest>,
): PublishAiResourceRequest[] {
  return resources.map((item) =>
    typeof item === 'string' ? { mode: 'sync', resource: item } : item,
  )
}
