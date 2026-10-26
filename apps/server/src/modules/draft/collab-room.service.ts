import type { WsAckPayload } from '@mx-space/ws-client/protocol'
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { z } from 'zod'

import { AppException } from '~/common/errors/exception.types'

import { DraftService } from './draft.service'
import type { DraftActor } from './draft.types'
import {
  type DocumentChange,
  type DocumentResetReason,
  DraftCrdtService,
} from './draft-crdt.service'

export const CollabWsEvents = {
  join: 'collab.join',
  leave: 'collab.leave',
  peerJoined: 'collab.peer.joined',
  peerLeft: 'collab.peer.left',
  presence: 'collab.presence',
  reset: 'collab.reset',
  revoked: 'collab.revoked',
  update: 'collab.update',
} as const

export const COLLAB_RELAY = Symbol('COLLAB_RELAY')
export const COLLAB_ACCESS = Symbol('COLLAB_ACCESS')

export interface CollabAccess {
  canJoin: (member: CollabMember, draftId: string) => Promise<boolean>
}

export interface CollabDropScope {
  reason: DocumentResetReason
}

export interface CollabRelay {
  drop: (documentId: string, scope: CollabDropScope) => void
  onDrop: (
    listener: (documentId: string, scope: CollabDropScope) => void,
  ) => () => void
  publish: (
    event: string,
    payload: unknown,
    room: string,
    exclude?: string,
  ) => void
}

export interface PresenceUser {
  avatar: string | null
  id: string
  name: string
}

export interface CollabIdentity {
  actor: DraftActor
  user: PresenceUser
}

export interface CollabMember {
  alive: () => boolean
  connectionId: string
  identity: CollabIdentity
  join: (room: string) => Promise<void>
  leave: (room: string) => Promise<void>
  send: (event: string, payload: unknown) => void
}

interface Joined {
  documentId: string
  member: CollabMember
}

const MAX_UPDATE_BYTES = 4 * 1024 * 1024
const MAX_CARET_CHARS = 4096
const REJECTED = 'DRAFT_CRDT_UPDATE_REJECTED'

const base64 = z.string().max(Math.ceil((MAX_UPDATE_BYTES * 4) / 3) + 8)
const draftId = z.string().min(1).max(64)
const joinSchema = z.object({ draftId, since: base64.optional() })
const updateSchema = z.object({ draftId, update: z.string() })
const presenceSchema = z.object({
  caret: z.unknown(),
  draftId,
  entry: z
    .string()
    .regex(/^agent:\w{1,40}$/)
    .optional(),
})
const leaveSchema = z.object({ draftId })

const roomOf = (documentId: string) => `collab:${documentId}`
const encode = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64')
const decode = (value: string) => new Uint8Array(Buffer.from(value, 'base64'))

const invalid: WsAckPayload = { code: 'VALIDATION_FAILED', ok: false }
const notJoined: WsAckPayload = { code: 'NOT_JOINED', ok: false }

@Injectable()
export class CollabRoomService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollabRoomService.name)
  private readonly joined = new Map<string, Map<string, Joined>>()
  private stopListening: Array<() => void> = []

  constructor(
    private readonly drafts: DraftService,
    private readonly crdt: DraftCrdtService,
    @Inject(COLLAB_RELAY) private readonly relay: CollabRelay,
    @Inject(COLLAB_ACCESS) private readonly access: CollabAccess,
  ) {}

  onModuleInit() {
    this.stopListening = [
      this.crdt.onDocumentChanged((change) => this.relayChange(change)),
      this.crdt.onDocumentReset(({ documentId, reason }) =>
        this.drop(documentId, { reason }),
      ),
      this.relay.onDrop((documentId, scope) =>
        this.dropLocal(documentId, scope),
      ),
    ]
  }

  onModuleDestroy() {
    for (const stop of this.stopListening.splice(0)) stop()
  }

  private drop(documentId: string, scope: CollabDropScope) {
    this.dropLocal(documentId, scope)
    this.relay.drop(documentId, scope)
  }

  async join(member: CollabMember, raw: unknown): Promise<WsAckPayload> {
    const parsed = joinSchema.safeParse(raw)
    if (!parsed.success) return invalid
    const { draftId, since } = parsed.data
    let room: string | null = null
    let entry: Joined | null = null
    const backOut = async (ack: WsAckPayload) => {
      this.forget(member.connectionId, draftId, entry)
      if (room) await member.leave(room).catch(() => undefined)
      return ack
    }
    try {
      const documentId = await this.drafts.documentIdOf(draftId)
      if (!(await this.access.canJoin(member, draftId))) {
        return { code: 'FORBIDDEN', ok: false }
      }
      // Registered before joining so a reset that lands mid-join finds and drops it.
      entry = { documentId, member }
      this.membership(member.connectionId).set(draftId, entry)
      room = roomOf(documentId)
      // Join before reading: a change stored after the read is then relayed to this member,
      // and one stored before it is in the snapshot. Loro dedupes anything seen twice.
      await member.join(room)
      if (!member.alive()) return backOut({ code: 'NOT_CONNECTED', ok: false })
      const { update } = await this.drafts.exportCrdtFor(
        draftId,
        member.identity.actor,
        since ? decode(since) : undefined,
      )
      if (!member.alive()) return backOut({ code: 'NOT_CONNECTED', ok: false })
      const stillJoined =
        this.joined.get(member.connectionId)?.get(draftId) === entry
      if (!stillJoined || !(await this.access.canJoin(member, draftId))) {
        return backOut({ code: 'FORBIDDEN', ok: false })
      }
      this.relay.publish(
        CollabWsEvents.peerJoined,
        { connectionId: member.connectionId, documentId },
        room,
        member.connectionId,
      )
      return {
        data: {
          connectionId: member.connectionId,
          documentId,
          update: encode(update),
        },
        ok: true,
      }
    } catch (error) {
      return backOut(this.failure(error))
    }
  }

  async update(member: CollabMember, raw: unknown): Promise<WsAckPayload> {
    const parsed = updateSchema.safeParse(raw)
    if (!parsed.success) return invalid
    const bytes = decode(parsed.data.update)
    if (bytes.length > MAX_UPDATE_BYTES) return { code: REJECTED, ok: false }
    const joined = this.joined
      .get(member.connectionId)
      ?.get(parsed.data.draftId)
    if (!joined) return notJoined
    try {
      await this.drafts.importCrdt(
        parsed.data.draftId,
        bytes,
        member.identity.actor,
        member.connectionId,
      )
      return { ok: true }
    } catch (error) {
      return this.failure(error)
    }
  }

  async presence(member: CollabMember, raw: unknown): Promise<WsAckPayload> {
    const parsed = presenceSchema.safeParse(raw)
    if (!parsed.success) return invalid
    const { caret, draftId, entry } = parsed.data
    const caretChars = JSON.stringify(caret ?? null).length
    if (caretChars > MAX_CARET_CHARS) return invalid
    const joined = this.joined.get(member.connectionId)?.get(draftId)
    if (!joined) return notJoined
    this.relay.publish(
      CollabWsEvents.presence,
      {
        caret: caret ?? null,
        connectionId: member.connectionId,
        documentId: joined.documentId,
        entry: entry ?? null,
        user: entry
          ? { avatar: null, id: entry, name: 'AI' }
          : member.identity.user,
      },
      roomOf(joined.documentId),
      member.connectionId,
    )
    return { ok: true }
  }

  async leave(member: CollabMember, raw: unknown): Promise<WsAckPayload> {
    const parsed = leaveSchema.safeParse(raw)
    if (!parsed.success) return invalid
    const rooms = this.joined.get(member.connectionId)
    const joined = rooms?.get(parsed.data.draftId)
    if (!rooms || !joined) return { ok: true }
    this.forget(member.connectionId, parsed.data.draftId)
    await member.leave(roomOf(joined.documentId))
    this.announceLeft(member.connectionId, joined.documentId)
    return { ok: true }
  }

  disconnect(connectionId: string) {
    const rooms = this.joined.get(connectionId)
    if (!rooms) return
    this.joined.delete(connectionId)
    for (const documentId of new Set(
      [...rooms.values()].map((joined) => joined.documentId),
    )) {
      this.announceLeft(connectionId, documentId)
    }
  }

  private dropLocal(documentId: string, scope: CollabDropScope) {
    for (const [connectionId, rooms] of this.joined) {
      for (const [draftId, joined] of rooms) {
        if (joined.documentId !== documentId) continue
        this.forget(connectionId, draftId)
        void joined.member.leave(roomOf(documentId)).catch(() => undefined)
        if (scope.reason === 'compacted') {
          joined.member.send(CollabWsEvents.reset, { documentId })
        } else {
          joined.member.send(CollabWsEvents.revoked, {
            documentId,
            reason: scope.reason,
          })
        }
        this.announceLeft(connectionId, documentId)
      }
    }
  }

  private forget(connectionId: string, draftId: string, only?: Joined | null) {
    const rooms = this.joined.get(connectionId)
    if (only !== undefined && rooms?.get(draftId) !== only) return
    rooms?.delete(draftId)
    if (rooms && !rooms.size) this.joined.delete(connectionId)
  }

  private relayChange(change: DocumentChange) {
    this.relay.publish(
      CollabWsEvents.update,
      { documentId: change.documentId, update: encode(change.update) },
      roomOf(change.documentId),
      change.origin,
    )
  }

  private announceLeft(connectionId: string, documentId: string) {
    this.relay.publish(
      CollabWsEvents.peerLeft,
      { connectionId, documentId },
      roomOf(documentId),
    )
  }

  private membership(connectionId: string) {
    let rooms = this.joined.get(connectionId)
    if (!rooms) {
      rooms = new Map()
      this.joined.set(connectionId, rooms)
    }
    return rooms
  }

  private failure(error: unknown): WsAckPayload {
    if (error instanceof AppException) return { code: error.code, ok: false }
    this.logger.warn(`collab request failed: ${(error as Error).message}`)
    return { code: 'INTERNAL_ERROR', ok: false }
  }
}
