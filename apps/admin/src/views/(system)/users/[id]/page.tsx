import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  hidden: true,
  titleKey: 'routes.users.detail',
})

export { UserDetailRoute as default } from '~/features/users/components/UserDetailRoute'
