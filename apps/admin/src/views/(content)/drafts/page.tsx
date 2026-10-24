import { FileClock } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.drafts.title',
  descriptionKey: 'routes.drafts.description',
  icon: FileClock,
  order: 1,
})

export { DraftsRouteView as default } from '~/features/drafts/routes/DraftsRouteView'
