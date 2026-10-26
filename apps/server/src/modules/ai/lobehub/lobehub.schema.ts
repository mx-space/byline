import { z } from 'zod'

export const LobeHubFlowIdSchema = z.uuid()
export const LobeHubCredentialSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().finite(),
})
export const LobeHubPendingSchema = z.object({
  deviceCode: z.string(),
  expiresAt: z.number(),
  intervalSeconds: z.number(),
  nextPollAt: z.number(),
})
