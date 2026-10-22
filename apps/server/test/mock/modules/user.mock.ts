import { defineProvider } from 'test/helper/defineProvider'

import { OwnerService } from '~/modules/owner/owner.service'

export const userProvider = defineProvider({
  provide: OwnerService,
  useValue: {},
})

export const ownerProvider = userProvider
