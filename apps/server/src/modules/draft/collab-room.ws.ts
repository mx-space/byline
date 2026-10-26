import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
  type Provider,
} from '@nestjs/common'

import { AuthService } from '~/modules/auth/auth.service'
import {
  type AdminWsContext,
  AdminWsHandlerRegistry,
} from '~/processors/gateway/admin/admin-ws-handler.registry'
import { WsBusService } from '~/processors/gateway/ws/ws-bus.service'

import {
  COLLAB_ACCESS,
  COLLAB_RELAY,
  type CollabAccess,
  type CollabDropScope,
  type CollabIdentity,
  type CollabMember,
  type CollabRelay,
  CollabRoomService,
  CollabWsEvents,
} from './collab-room.service'
import { DraftService } from './draft.service'

const DROP_EVENT = 'collab.drop'
const DROP_REASONS = new Set<CollabDropScope['reason']>([
  'compacted',
  'deleted',
])

const isDropReason = (value: unknown): value is CollabDropScope['reason'] =>
  DROP_REASONS.has(value as CollabDropScope['reason'])

export const collabRelayProvider: Provider = {
  inject: [WsBusService],
  provide: COLLAB_RELAY,
  useFactory: (bus: WsBusService): CollabRelay => ({
    drop: (documentId, scope) =>
      bus.publish({
        event: DROP_EVENT,
        ns: 'collab',
        payload: { documentId, ...scope },
      }),
    onDrop: (listener) =>
      bus.register('collab', (frame) => {
        if (frame.event !== DROP_EVENT) return
        const payload = frame.payload as
          { documentId?: string; reason?: string } | undefined
        if (!payload?.documentId || !isDropReason(payload.reason)) return
        listener(payload.documentId, { reason: payload.reason })
      }),
    publish: (event, payload, room, exclude) =>
      bus.publish({
        event,
        exclude: exclude ? [exclude] : undefined,
        ns: 'admin',
        payload,
        rooms: [room],
      }),
  }),
}

export const collabAccessProvider: Provider = {
  inject: [DraftService],
  provide: COLLAB_ACCESS,
  useFactory: (drafts: DraftService): CollabAccess => ({
    canJoin: (member, draftId) =>
      drafts.canEdit(draftId, member.identity.actor),
  }),
}

const memberOf = (
  ctx: AdminWsContext,
  identity: CollabIdentity,
): CollabMember => ({
  alive: ctx.alive,
  connectionId: ctx.connectionId,
  identity,
  join: ctx.join,
  leave: ctx.leave,
  send: ctx.send,
})

const unauthenticated = { code: 'NOT_AUTHENTICATED', ok: false } as const

type RoomHandler = (
  room: CollabRoomService,
  member: CollabMember,
  payload: unknown,
) => ReturnType<CollabRoomService['join']>

const ROOM_HANDLERS: Array<[string, RoomHandler]> = [
  [CollabWsEvents.join, (room, member, payload) => room.join(member, payload)],
  [
    CollabWsEvents.update,
    (room, member, payload) => room.update(member, payload),
  ],
  [
    CollabWsEvents.presence,
    (room, member, payload) => room.presence(member, payload),
  ],
  [
    CollabWsEvents.leave,
    (room, member, payload) => room.leave(member, payload),
  ],
]

@Injectable()
export class CollabRoomWsHandler implements OnModuleInit, OnModuleDestroy {
  private readonly disposers: Array<() => void> = []

  constructor(
    private readonly registry: AdminWsHandlerRegistry,
    private readonly rooms: CollabRoomService,
    private readonly authService: AuthService,
  ) {}

  onModuleInit() {
    for (const [event, handle] of ROOM_HANDLERS) {
      this.disposers.push(
        this.registry.register(event, async (ctx, payload) => {
          const identity = await this.identityOf(ctx.userId)
          if (!identity) return unauthenticated
          return handle(this.rooms, memberOf(ctx, identity), payload)
        }),
      )
    }
    this.disposers.push(
      this.registry.onDisconnect((connectionId) =>
        this.rooms.disconnect(connectionId),
      ),
    )
  }

  onModuleDestroy() {
    for (const dispose of this.disposers.splice(0)) dispose()
  }

  private async identityOf(userId: string): Promise<CollabIdentity | null> {
    const user = await this.authService.getActiveUserById(userId)
    if (!user) return null
    return {
      actor: { id: user.id, permissions: user.permissions ?? null },
      user: {
        avatar: user.image ?? null,
        id: user.id,
        name: user.name || user.username || user.id,
      },
    }
  }
}
