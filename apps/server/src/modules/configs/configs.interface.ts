import type { z } from 'zod'

import {
  type AISchema,
  type AuthSecuritySchema,
  configSchemaMapping,
  type FileUploadOptionsSchema,
  type ImageGenerationOptionsSchema,
  type ImageStorageOptionsSchema,
  type MailOptionsSchema,
  type OAuthSchema,
  type TtsOptionsSchema,
  type UrlSchema,
} from './configs.schema'

/**
 * Config schema mapping for validation and JSON schema generation
 */
export const configDtoMapping = configSchemaMapping

/**
 * Main configuration interface
 * Each property corresponds to a config section with its Zod schema type
 */
export abstract class IConfig {
  url: Required<z.infer<typeof UrlSchema>>
  mailOptions: Required<z.infer<typeof MailOptionsSchema>>
  imageStorageOptions: Required<z.infer<typeof ImageStorageOptionsSchema>>
  imageGenerationOptions: Required<z.infer<typeof ImageGenerationOptionsSchema>>
  ttsOptions: Required<z.infer<typeof TtsOptionsSchema>>
  fileUploadOptions: Required<z.infer<typeof FileUploadOptionsSchema>>
  authSecurity: z.infer<typeof AuthSecuritySchema>
  ai: z.infer<typeof AISchema>
  oauth: z.infer<typeof OAuthSchema>
}

export type IConfigKeys = keyof IConfig
