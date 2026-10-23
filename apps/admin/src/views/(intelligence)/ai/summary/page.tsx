import { FileText } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.aiSummary.title',
  descriptionKey: 'routes.aiSummary.description',
  icon: FileText,
  order: 3,
  hidden: true,
})

export { AiSummaryRouteView as default } from '~/features/ai/routes/AiSummaryRouteView'
