import { z } from 'zod'

import type { OpenApiRoute } from './openapi.types'

/**
 * better-auth's device-authorization plugin speaks RFC 8628 verbatim and is
 * mounted as a Nest middleware, so neither the case pipeline nor the response
 * envelope applies. These schemas therefore carry literal wire names.
 */
const DeviceCodeRequestSchema = z.object({
  client_id: z.string(),
  scope: z.string().optional(),
})

const DeviceCodeResponseSchema = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_uri: z.string(),
  verification_uri_complete: z.string().optional(),
  expires_in: z.number().int(),
  interval: z.number().int(),
})

const DeviceTokenRequestSchema = z.object({
  grant_type: z.literal('urn:ietf:params:oauth:grant-type:device_code'),
  device_code: z.string(),
  client_id: z.string(),
})

const DeviceTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int(),
  scope: z.string().optional(),
})

const DeviceErrorSchema = z.object({
  error: z.enum([
    'authorization_pending',
    'slow_down',
    'expired_token',
    'access_denied',
    'invalid_client',
    'invalid_request',
    'server_error',
  ]),
  error_description: z.string().optional(),
})

const HealthResponseSchema = z.object({ ok: z.boolean() })
const OneTimeTokenResponseSchema = z.object({ token: z.string() })

export const routeManifest: readonly OpenApiRoute[] = [
  {
    operationId: 'getHealth',
    method: 'get',
    path: '/health',
    tag: 'health',
    summary: 'Probe reachability and API version of a self-hosted instance',
    auth: false,
    response: { name: 'HealthStatus', schema: HealthResponseSchema },
  },

  {
    operationId: 'requestDeviceCode',
    method: 'post',
    path: '/auth/device/code',
    tag: 'auth',
    summary: 'Start the device authorization pairing flow',
    auth: false,
    envelope: false,
    body: { name: 'DeviceCodeRequest', schema: DeviceCodeRequestSchema },
    response: { name: 'DeviceCodeResponse', schema: DeviceCodeResponseSchema },
    errorResponse: { name: 'DeviceError', schema: DeviceErrorSchema },
  },
  {
    operationId: 'pollDeviceToken',
    method: 'post',
    path: '/auth/device/token',
    tag: 'auth',
    summary: 'Exchange an approved device code for a session token',
    auth: false,
    envelope: false,
    body: { name: 'DeviceTokenRequest', schema: DeviceTokenRequestSchema },
    response: {
      name: 'DeviceTokenResponse',
      schema: DeviceTokenResponseSchema,
    },
    errorResponse: { name: 'DeviceError', schema: DeviceErrorSchema },
  },
  {
    operationId: 'generateWebHandoffToken',
    method: 'get',
    path: '/auth/one-time-token/generate',
    tag: 'auth',
    summary:
      'Create a single-use token that transfers the mobile session to Web',
    auth: true,
    envelope: false,
    response: {
      name: 'OneTimeTokenResponse',
      schema: OneTimeTokenResponseSchema,
    },
  },
] as const
