import { Injectable } from '@nestjs/common'

import type { BusinessEvents } from '~/constants/business-event.constant'

import { AdminEventsGateway } from '../admin/events.gateway'

@Injectable()
export class SharedGateway {
  constructor(private readonly admin: AdminEventsGateway) {}

  broadcast(event: BusinessEvents, data: any) {
    this.admin.broadcast(event, data)
  }
}
