import { Users } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.users.title',
  descriptionKey: 'routes.users.description',
  icon: Users,
  order: 1,
})

export { UsersRouteView as default } from '~/features/users/routes/UsersRouteView'
