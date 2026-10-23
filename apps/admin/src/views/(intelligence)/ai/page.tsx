import { Sparkles } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

// `/ai` redirects to the overview. Kept so the redirect stays a real route;
// it is not a sidebar node.
export const metadata = defineMetadata({
  titleKey: 'routes.ai.title',
  descriptionKey: 'routes.ai.description',
  icon: Sparkles,
  order: 1,
  hidden: true,
})
export { AiOverviewRouteView as default } from '~/features/ai/routes/AiOverviewRouteView'
