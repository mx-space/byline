import { CalendarClock } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.scheduledPosts.title',
  descriptionKey: 'routes.scheduledPosts.description',
  icon: CalendarClock,
  order: 2,
})

export { ScheduledPostsRouteView as default } from '~/features/posts/routes/ScheduledPostsRouteView'
