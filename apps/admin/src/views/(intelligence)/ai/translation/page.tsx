import { Languages } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.aiTranslation.title',
  descriptionKey: 'routes.aiTranslation.description',
  icon: Languages,
  order: 2,
  hidden: true,
})

export { AiTranslationRouteView as default } from '~/features/ai/routes/AiTranslationRouteView'
