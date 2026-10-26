import { describe, expect, it, vi } from 'vitest'

import { createAppException } from '~/common/errors'
import { AppErrorCode } from '~/common/errors/app-error-code'
import {
  type CollabDropScope,
  type CollabIdentity,
  type CollabMember,
  CollabRoomService,
  CollabWsEvents,
} from '~/modules/draft/collab-room.service'
import type {
  DocumentChange,
  DocumentReset,
} from '~/modules/draft/draft-crdt.service'

const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64')

const owner: CollabIdentity = {
  actor: { id: 'owner-1', permissions: null },
  user: { avatar: 'https://a.test/owner.png', id: 'owner-1', name: 'Owner' },
}
const editor = (id: string): CollabIdentity => ({
  actor: { id, permissions: null },
  user: { avatar: null, id, name: `Editor ${id}` },
})

const setup = (access: (documentId: string) => boolean = () => true) => {
  const order: string[] = []
  let dropListener:
    ((documentId: string, scope: CollabDropScope) => void) | undefined
  let resetListener: ((reset: DocumentReset) => void) | undefined
  let listener: ((change: DocumentChange) => void) | undefined
  const crdt = {
    onDocumentChanged: vi.fn((next: (change: DocumentChange) => void) => {
      listener = next
      return () => {
        listener = undefined
      }
    }),
    onDocumentReset: vi.fn((next: (reset: DocumentReset) => void) => {
      resetListener = next
      return () => {
        resetListener = undefined
      }
    }),
  }
  const drafts = {
    documentIdOf: vi.fn(async () => 'doc-1'),
    exportCrdtFor: vi.fn(async () => {
      order.push('export')
      return { documentId: 'doc-1', update: new Uint8Array([1, 2, 3]) }
    }),
    importCrdt: vi.fn(async () => undefined),
  }
  const published: {
    event: string
    exclude?: string
    payload: unknown
    room: string
  }[] = []
  const relay = {
    drop: vi.fn((documentId: string, scope: CollabDropScope) =>
      dropListener?.(documentId, scope),
    ),
    onDrop: (next: (documentId: string, scope: CollabDropScope) => void) => {
      dropListener = next
      return () => {
        dropListener = undefined
      }
    },
    publish: vi.fn(
      (event: string, payload: unknown, room: string, exclude?: string) => {
        published.push({ event, exclude, payload, room })
      },
    ),
  }
  const service = new CollabRoomService(drafts as never, crdt as never, relay, {
    canJoin: async (_member, draftId) => access(draftId),
  })
  service.onModuleInit()
  const member = (
    connectionId: string,
    alive = () => true,
    identity: CollabIdentity = owner,
  ): CollabMember => ({
    alive,
    connectionId,
    identity,
    join: vi.fn(async () => {
      order.push('join')
    }),
    leave: vi.fn(async () => undefined),
    send: vi.fn(),
  })
  return {
    order,
    relay,
    change: (change: DocumentChange) => listener?.(change),
    drafts,
    member,
    published,
    reset: (next: DocumentReset) => resetListener?.(next),
    service,
  }
}

describe('CollabRoomService', () => {
  it('joins the document room and returns what the member lacks', async () => {
    const { drafts, member, published, service } = setup()
    const alice = member('conn-a')

    const ack = await service.join(alice, { draftId: 'd1', since: b64([9]) })

    expect(ack).toEqual({
      data: {
        connectionId: 'conn-a',
        documentId: 'doc-1',
        update: b64([1, 2, 3]),
      },
      ok: true,
    })
    expect(drafts.exportCrdtFor).toHaveBeenCalledWith(
      'd1',
      owner.actor,
      new Uint8Array([9]),
    )
    expect(alice.join).toHaveBeenCalledWith('collab:doc-1')
    expect(published).toEqual([
      {
        event: CollabWsEvents.peerJoined,
        exclude: 'conn-a',
        payload: { connectionId: 'conn-a', documentId: 'doc-1' },
        room: 'collab:doc-1',
      },
    ])
  })

  it('stores an update with its origin and relays stored changes to everyone else', async () => {
    const { change, drafts, member, published, service } = setup()
    const alice = member('conn-a')
    await service.join(alice, { draftId: 'd1' })
    published.length = 0

    const ack = await service.update(alice, {
      draftId: 'd1',
      update: b64([7, 7]),
    })
    change({
      documentId: 'doc-1',
      origin: 'conn-a',
      update: new Uint8Array([7, 7]),
    })
    change({ documentId: 'doc-1', update: new Uint8Array([8]) })

    expect(ack).toEqual({ ok: true })
    expect(drafts.importCrdt).toHaveBeenCalledWith(
      'd1',
      new Uint8Array([7, 7]),
      owner.actor,
      'conn-a',
    )
    expect(published).toEqual([
      {
        event: CollabWsEvents.update,
        exclude: 'conn-a',
        payload: { documentId: 'doc-1', update: b64([7, 7]) },
        room: 'collab:doc-1',
      },
      {
        event: CollabWsEvents.update,
        exclude: undefined,
        payload: { documentId: 'doc-1', update: b64([8]) },
        room: 'collab:doc-1',
      },
    ])
  })

  it('acks a rejected update with its code', async () => {
    const { drafts, member, service } = setup()
    const alice = member('conn-a')
    await service.join(alice, { draftId: 'd1' })
    drafts.importCrdt.mockRejectedValueOnce(
      createAppException(AppErrorCode.DRAFT_CRDT_UPDATE_REJECTED, {
        branchId: 'd1',
        reason: 'lineage',
      }),
    )

    const ack = await service.update(alice, {
      draftId: 'd1',
      update: b64([1]),
    })

    expect(ack).toEqual({ code: 'DRAFT_CRDT_UPDATE_REJECTED', ok: false })
  })

  it('joins the room before reading the snapshot, so no relayed change falls between', async () => {
    const { member, order, service } = setup()

    await service.join(member('conn-a'), { draftId: 'd1' })

    expect(order).toEqual(['join', 'export'])
  })

  it('undoes a join whose connection closed while it was in flight', async () => {
    const { member, published, service } = setup()
    let open = true
    const alice = member('conn-a', () => open)
    ;(alice.join as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      open = false
    })

    const ack = await service.join(alice, { draftId: 'd1' })

    expect(ack).toEqual({ code: 'NOT_CONNECTED', ok: false })
    expect(alice.leave).toHaveBeenCalledWith('collab:doc-1')
    expect(published).toEqual([])
    expect(
      await service.presence(alice, { caret: null, draftId: 'd1' }),
    ).toEqual({ code: 'NOT_JOINED', ok: false })
  })

  it('refuses members the access check rejects', async () => {
    const { drafts, member, service } = setup(() => false)
    const alice = member('conn-a')

    const ack = await service.join(alice, { draftId: 'd1' })

    expect(ack).toEqual({ code: 'FORBIDDEN', ok: false })
    expect(alice.join).not.toHaveBeenCalled()
    expect(drafts.exportCrdtFor).not.toHaveBeenCalled()
  })

  it('refuses updates from a connection that has not joined the document', async () => {
    const { drafts, member, service } = setup()

    const ack = await service.update(member('conn-a'), {
      draftId: 'd1',
      update: b64([1]),
    })

    expect(ack).toEqual({ code: 'NOT_JOINED', ok: false })
    expect(drafts.importCrdt).not.toHaveBeenCalled()
  })

  it('refuses an update over the size limit without storing it', async () => {
    const { drafts, member, service } = setup()

    const ack = await service.update(member('conn-a'), {
      draftId: 'd1',
      update: Buffer.alloc(4 * 1024 * 1024 + 1).toString('base64'),
    })

    expect(ack).toEqual({ code: 'DRAFT_CRDT_UPDATE_REJECTED', ok: false })
    expect(drafts.importCrdt).not.toHaveBeenCalled()
  })

  it('relays presence stamped with the identity the server holds', async () => {
    const { member, published, service } = setup()
    const alice = member('conn-a')
    const caret = { anchor: { id: 'p1', offset: 2 } }

    expect(await service.presence(alice, { caret, draftId: 'd1' })).toEqual({
      code: 'NOT_JOINED',
      ok: false,
    })

    await service.join(alice, { draftId: 'd1' })
    published.length = 0
    const ack = await service.presence(alice, {
      caret,
      draftId: 'd1',
      user: { name: 'Mallory' },
    })
    await service.presence(alice, {
      caret: null,
      draftId: 'd1',
      entry: 'agent:42',
    })

    expect(ack).toEqual({ ok: true })
    expect(published).toEqual([
      {
        event: CollabWsEvents.presence,
        exclude: 'conn-a',
        payload: {
          caret,
          connectionId: 'conn-a',
          documentId: 'doc-1',
          entry: null,
          user: owner.user,
        },
        room: 'collab:doc-1',
      },
      {
        event: CollabWsEvents.presence,
        exclude: 'conn-a',
        payload: {
          caret: null,
          connectionId: 'conn-a',
          documentId: 'doc-1',
          entry: 'agent:42',
          user: { avatar: null, id: 'agent:42', name: 'AI' },
        },
        room: 'collab:doc-1',
      },
    ])
  })

  it('clears every member of a rebuilt or deleted document on every pod', async () => {
    const { member, relay, reset, service } = setup()
    const alice = member('conn-a')
    const bob = member('conn-b', () => true, editor('e1'))
    await service.join(alice, { draftId: 'd1' })
    await service.join(bob, { draftId: 'd1' })

    reset({ documentId: 'doc-1', reason: 'compacted' })

    expect(relay.drop).toHaveBeenCalledWith('doc-1', { reason: 'compacted' })
    for (const peer of [alice, bob]) {
      expect(peer.leave).toHaveBeenCalledWith('collab:doc-1')
      expect(peer.send).toHaveBeenCalledWith(CollabWsEvents.reset, {
        documentId: 'doc-1',
      })
    }
    expect(
      await service.update(alice, { draftId: 'd1', update: b64([1]) }),
    ).toEqual({ code: 'NOT_JOINED', ok: false })

    await service.join(bob, { draftId: 'd1' })
    reset({ documentId: 'doc-1', reason: 'deleted' })

    expect(bob.send).toHaveBeenCalledWith(CollabWsEvents.revoked, {
      documentId: 'doc-1',
      reason: 'deleted',
    })
  })

  it('announces a member leaving on leave and on disconnect', async () => {
    const { member, published, service } = setup()
    const alice = member('conn-a')
    const bob = member('conn-b')
    await service.join(alice, { draftId: 'd1' })
    await service.join(bob, { draftId: 'd1' })
    published.length = 0

    await service.leave(alice, { draftId: 'd1' })
    service.disconnect('conn-b')
    service.disconnect('conn-b')

    expect(alice.leave).toHaveBeenCalledWith('collab:doc-1')
    expect(published.map((frame) => [frame.event, frame.payload])).toEqual([
      [
        CollabWsEvents.peerLeft,
        { connectionId: 'conn-a', documentId: 'doc-1' },
      ],
      [
        CollabWsEvents.peerLeft,
        { connectionId: 'conn-b', documentId: 'doc-1' },
      ],
    ])
  })

  it('rejects malformed payloads', async () => {
    const { member, service } = setup()

    expect(await service.join(member('conn-a'), { draftId: 3 })).toEqual({
      code: 'VALIDATION_FAILED',
      ok: false,
    })
  })

  it('backs out a join whose access was removed while it was loading', async () => {
    let allowed = true
    const { drafts, member, service } = setup(() => allowed)
    drafts.exportCrdtFor.mockImplementationOnce(async () => {
      allowed = false
      return { documentId: 'doc-1', update: new Uint8Array([1]) }
    })
    const bob = member('conn-b', () => true, editor('e1'))

    const ack = await service.join(bob, { draftId: 'd1' })

    expect(ack).toEqual({ code: 'FORBIDDEN', ok: false })
    expect(bob.leave).toHaveBeenCalledWith('collab:doc-1')
    expect(
      await service.update(bob, { draftId: 'd1', update: b64([1]) }),
    ).toEqual({ code: 'NOT_JOINED', ok: false })
  })

  it('leaves the room again when loading the document fails', async () => {
    const { drafts, member, service } = setup()
    drafts.exportCrdtFor.mockRejectedValueOnce(new Error('boom'))
    const bob = member('conn-b', () => true, editor('e1'))

    const ack = await service.join(bob, { draftId: 'd1' })

    expect(ack).toEqual({ code: 'INTERNAL_ERROR', ok: false })
    expect(bob.leave).toHaveBeenCalledWith('collab:doc-1')
  })
})
