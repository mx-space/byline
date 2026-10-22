import { EventEmitter2 } from '@nestjs/event-emitter'
import { describe, expect, it, vi } from 'vitest'

import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import { EventManagerService } from '~/processors/helper/helper.event.service'

const createManager = () => {
  const order: string[] = []
  const apiCache = {
    invalidate: vi.fn(async () => {
      order.push('invalidate')
    }),
  }
  const manager = new EventManagerService(
    { broadcast: vi.fn() } as any,
    new EventEmitter2(),
    {} as any,
    apiCache as any,
  )
  manager.registerHandler((event: BusinessEvents) => {
    order.push(`handler:${event}`)
  })
  return { manager, apiCache, order }
}

describe('EventManagerService public cache invalidation', () => {
  it.each([
    BusinessEvents.POST_CREATE,
    BusinessEvents.POST_UPDATE,
    BusinessEvents.POST_DELETE,
    BusinessEvents.CATEGORY_UPDATE,
    BusinessEvents.TRANSLATION_CREATE,
    BusinessEvents.TRANSLATION_DELETE,
    BusinessEvents.SUMMARY_GENERATED,
  ])('invalidates before webhook handlers see %s', async (event) => {
    const { manager, order } = createManager()

    await manager.emit(event, { id: '1' }, { scope: EventScope.TO_SYSTEM })

    expect(order).toEqual(['invalidate', `handler:${event}`])
  })

  it('leaves the cache alone for events that change no public content', async () => {
    const { manager, apiCache } = createManager()

    await manager.emit(
      BusinessEvents.DRAFT_UPDATE,
      { id: '1' },
      { scope: EventScope.TO_SYSTEM },
    )

    expect(apiCache.invalidate).not.toHaveBeenCalled()
  })

  it('still dispatches the event when invalidation fails', async () => {
    const { manager, apiCache, order } = createManager()
    apiCache.invalidate.mockRejectedValueOnce(new Error('redis down'))

    await manager.emit(
      BusinessEvents.POST_UPDATE,
      { id: '1' },
      { scope: EventScope.TO_SYSTEM },
    )

    expect(order).toEqual([`handler:${BusinessEvents.POST_UPDATE}`])
  })
})
