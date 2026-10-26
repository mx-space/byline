import { randomUUID } from 'node:crypto'

import { redisHelper } from 'test/helper/redis-mock.helper'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { BusinessEvents } from '~/constants/business-event.constant'
import {
  CollabRoomService,
  CollabWsEvents,
} from '~/modules/draft/collab-room.service'
import {
  collabAccessProvider,
  collabRelayProvider,
  CollabRoomWsHandler,
} from '~/modules/draft/collab-room.ws'
import { DraftService } from '~/modules/draft/draft.service'
import {
  type DocumentChange,
  DraftCrdtService,
} from '~/modules/draft/draft-crdt.service'

import {
  createGatewayApp,
  type GatewayTestApp,
  WsTestClient,
} from './gateway-e2e.harness'

vi.setConfig({ testTimeout: 15_000 })

const listeners = new Set<(change: DocumentChange) => void>()
const crdtStub = {
  onDocumentChanged: (listener: (change: DocumentChange) => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  onDocumentReset: () => () => undefined,
}
const editors = new Set(['alice', 'bob'])
const draftStub = {
  canEdit: vi.fn(async (_id: string, actor: { id: string }) =>
    editors.has(actor.id),
  ),
  documentIdOf: vi.fn(async () => 'doc-1'),
  exportCrdtFor: vi.fn(async () => ({
    documentId: 'doc-1',
    update: new Uint8Array([1]),
  })),
  importCrdt: vi.fn(
    async (
      _id: string,
      update: Uint8Array,
      _actor: unknown,
      origin?: string,
    ) => {
      for (const listener of listeners) {
        listener({ documentId: 'doc-1', origin, update })
      }
    },
  ),
}

const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64')

describe('collab room over the admin gateway', () => {
  let testApp: GatewayTestApp

  beforeAll(async () => {
    const helper = await redisHelper
    const opts = helper.CacheService.getClient().options
    testApp = await createGatewayApp(
      { host: opts.host as string, port: opts.port as number },
      [
        CollabRoomService,
        CollabRoomWsHandler,
        collabRelayProvider,
        collabAccessProvider,
        { provide: DraftService, useValue: draftStub },
        { provide: DraftCrdtService, useValue: crdtStub },
      ],
    )
    testApp.authService.getActiveUserById.mockImplementation(
      async (id: string) => ({
        id,
        image: null,
        name: `User ${id}`,
        permissions: 0,
      }),
    )
  })

  afterAll(async () => {
    await testApp.close()
  })

  const connect = async (userId: string) => {
    testApp.authService.verifyApiKey.mockResolvedValueOnce({
      id: `key-${userId}`,
      referenceId: userId,
    })
    testApp.authService.isActiveUserId.mockResolvedValueOnce(true)
    const client = await WsTestClient.connect(testApp.adminUrl(), {
      headers: { 'x-api-key': `key-${userId}` },
    })
    await client.waitFor((e) => e.event === BusinessEvents.GATEWAY_CONNECT)
    return client
  }

  const request = async (
    client: WsTestClient,
    event: string,
    payload: unknown,
  ) => {
    const id = randomUUID()
    client.send(event, payload, id)
    return (await client.waitForAck(id)).payload as Record<string, unknown>
  }

  it('relays updates and presence between members and announces leaving', async () => {
    const alice = await connect('alice')
    const bob = await connect('bob')
    try {
      expect(
        await request(alice, CollabWsEvents.join, { draftId: 'd1' }),
      ).toMatchObject({
        data: { documentId: 'doc-1', update: b64([1]) },
        ok: true,
      })
      await request(bob, CollabWsEvents.join, { draftId: 'd1' })
      await alice.waitFor((e) => e.event === CollabWsEvents.peerJoined)

      expect(
        await request(alice, CollabWsEvents.update, {
          draftId: 'd1',
          update: b64([4, 2]),
        }),
      ).toEqual({ ok: true })
      const update = await bob.waitFor((e) => e.event === CollabWsEvents.update)
      expect(update.payload).toEqual({
        documentId: 'doc-1',
        update: b64([4, 2]),
      })
      await alice.assertNotDelivered((e) => e.event === CollabWsEvents.update)
      expect(draftStub.importCrdt).toHaveBeenCalledWith(
        'd1',
        new Uint8Array([4, 2]),
        expect.objectContaining({ id: 'alice' }),
        expect.any(String),
      )

      await request(bob, CollabWsEvents.presence, {
        caret: { id: 'p1', offset: 1 },
        draftId: 'd1',
      })
      const presence = await alice.waitFor(
        (e) => e.event === CollabWsEvents.presence,
      )
      expect(presence.payload).toMatchObject({
        caret: { id: 'p1', offset: 1 },
        documentId: 'doc-1',
        entry: null,
        user: { avatar: null, id: 'bob', name: 'User bob' },
      })

      await alice.closeAndWait()
      const left = await bob.waitFor((e) => e.event === CollabWsEvents.peerLeft)
      expect(left.payload).toMatchObject({ documentId: 'doc-1' })
    } finally {
      await bob.closeAndWait()
    }
  })

  it('refuses a member who cannot edit the article', async () => {
    const mallory = await connect('mallory')
    try {
      expect(
        await request(mallory, CollabWsEvents.join, { draftId: 'd1' }),
      ).toEqual({ code: 'FORBIDDEN', ok: false })
    } finally {
      await mallory.closeAndWait()
    }
  })

  it('ignores collab frames from a socket that has not authenticated', async () => {
    testApp.authService.verifyApiKey.mockReturnValueOnce(
      new Promise(() => undefined) as never,
    )
    const stranger = await WsTestClient.connect(testApp.adminUrl(), {
      headers: { 'x-api-key': 'pending' },
    })
    try {
      draftStub.importCrdt.mockClear()
      draftStub.exportCrdtFor.mockClear()
      expect(
        await request(stranger, CollabWsEvents.join, { draftId: 'd1' }),
      ).toEqual({ code: 'NOT_AUTHENTICATED', ok: false })
      expect(
        await request(stranger, CollabWsEvents.update, {
          draftId: 'd1',
          update: b64([1]),
        }),
      ).toEqual({ code: 'NOT_AUTHENTICATED', ok: false })
      expect(draftStub.exportCrdtFor).not.toHaveBeenCalled()
      expect(draftStub.importCrdt).not.toHaveBeenCalled()
    } finally {
      await stranger.closeAndWait()
    }
  })
})
