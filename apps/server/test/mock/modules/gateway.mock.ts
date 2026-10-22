import { defineProviders } from 'test/helper/defineProvider'

import { AdminEventsGateway } from '~/processors/gateway/admin/events.gateway'

export const gatewayProviders = defineProviders([
  {
    provide: AdminEventsGateway,
    useValue: {},
  },
])
