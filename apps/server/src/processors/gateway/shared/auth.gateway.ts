import type { IncomingMessage } from 'node:http'

import { OnEvent } from '@nestjs/event-emitter'
import type { WebSocket } from 'ws'

import { EventBusEvents } from '~/constants/event-bus.constant'
import { AuthService } from '~/modules/auth/auth.service'

import { BusinessEvents } from '../../../constants/business-event.constant'
import type { WsBusFrame, WsConnection, WsNamespace } from '../ws/ws.types'
import { WsBusService } from '../ws/ws-bus.service'
import { WsGatewayBase } from '../ws/ws-gateway.base'
import { WsPresenceService } from '../ws/ws-presence.service'

export type AuthGatewayOptions = {
  namespace: WsNamespace
}

const AUTH_FAILED_CLOSE_CODE = 4401

export const createAuthGateway = (options: AuthGatewayOptions) => {
  const { namespace } = options

  class AuthGateway extends WsGatewayBase {
    constructor(
      protected readonly authService: AuthService,
      bus: WsBusService,
      presence: WsPresenceService,
    ) {
      super(namespace, bus, presence)
    }

    tokenSocketIdMap = new Map<string, Set<string>>()
    private readonly authenticatedUsers = new WeakMap<WsConnection, string>()

    // Message handlers run as soon as the socket is tracked, before the auth lookup settles,
    // and keep running while a rejected socket is closing.
    protected authenticatedUserOf(conn: WsConnection) {
      return this.authenticatedUsers.get(conn)
    }
    private readonly socketIdTokenMap = new Map<string, string>()

    protected bindToken(token: string, conn: WsConnection) {
      const ids = this.tokenSocketIdMap.get(token) ?? new Set<string>()
      ids.add(conn.id)
      this.tokenSocketIdMap.set(token, ids)
      this.socketIdTokenMap.set(conn.id, token)
    }

    protected unbindToken(conn: WsConnection) {
      const token = this.socketIdTokenMap.get(conn.id)
      if (!token) return
      this.socketIdTokenMap.delete(conn.id)
      const ids = this.tokenSocketIdMap.get(token)
      ids?.delete(conn.id)
      if (!ids?.size) this.tokenSocketIdMap.delete(token)
    }

    authFailed(conn: WsConnection) {
      this.sendTo(conn, BusinessEvents.AUTH_FAILED, 'Authentication failed')
      conn.ws.close(AUTH_FAILED_CLOSE_CODE, 'auth failed')
    }

    async handleConnection(ws: WebSocket, request: IncomingMessage) {
      const conn = this.trackConnection(ws)
      await this.presence.addConnection(namespace, conn.id)

      const { cookie, origin } = request.headers
      if (cookie) {
        const headers = new Headers()
        headers.set('cookie', cookie)
        if (origin) {
          headers.set('origin', origin)
        }
        const session =
          await this.authService.getSessionUserFromHeaders(headers)
        if (session?.user?.id) {
          return this.completeConnection(
            conn,
            session.user.id,
            session.session?.token,
          )
        }
      }

      const headerApiKey = request.headers['x-api-key']
      const headerAuthorization = request.headers.authorization
      const apiKey =
        (Array.isArray(headerApiKey) ? headerApiKey[0] : headerApiKey) ||
        headerAuthorization ||
        queryToken(request)
      if (!apiKey) {
        return this.authFailed(conn)
      }

      const token = apiKey.replace(/^bearer\s+/i, '')
      const result = await this.authService.verifyApiKey(token)
      if (
        !result ||
        !(await this.authService.isActiveUserId(result.referenceId))
      ) {
        return this.authFailed(conn)
      }

      this.completeConnection(conn, result.referenceId, result.id)
    }

    // A close during the auth lookups already unbound this connection; binding
    // now would strand the token entry, since nothing unbinds it again.
    private completeConnection(
      conn: WsConnection,
      userId: string,
      token?: string,
    ) {
      if (!this.resolveConnection(conn.ws)) return
      this.authenticatedUsers.set(conn, userId)
      this.sendConnectGreeting(conn)
      if (token) this.bindToken(token, conn)
    }

    async handleDisconnect(ws: WebSocket) {
      const conn = this.resolveConnection(ws)
      if (!conn) return

      this.authenticatedUsers.delete(conn)
      await this.releaseConnection(conn)
      this.unbindToken(conn)
      this.sendDisconnectGreeting(conn)
    }

    @OnEvent(EventBusEvents.TokenExpired)
    handleTokenExpired(token: string) {
      const closed = this.closeExpiredToken(token)
      this.bus.publish({
        ns: this.namespace,
        event: EventBusEvents.TokenExpired,
        payload: token,
      })
      return closed
    }

    protected override deliverLocal(frame: WsBusFrame) {
      if (
        frame.event === EventBusEvents.TokenExpired &&
        typeof frame.payload === 'string'
      ) {
        this.closeExpiredToken(frame.payload)
        return
      }
      super.deliverLocal(frame)
    }

    private closeExpiredToken(token: string) {
      const ids = this.tokenSocketIdMap.get(token)
      if (!ids) return false
      for (const id of ids) {
        const conn = this.registry.get(id)
        if (!conn) continue
        conn.ws.close(AUTH_FAILED_CLOSE_CODE, 'token expired')
        void this.handleDisconnect(conn.ws)
      }
      this.tokenSocketIdMap.delete(token)
      return true
    }
  }

  return AuthGateway
}

function queryToken(request: IncomingMessage): string | undefined {
  try {
    return (
      new URL(request.url ?? '', 'ws://localhost').searchParams.get('token') ??
      undefined
    )
  } catch {
    return undefined
  }
}
