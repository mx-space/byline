import type { LitexmlRegistryProvider } from '@haklex/rich-agent-core'
import type { useAgentLoop } from '@haklex/rich-ext-ai-agent'

import type { RichEditorProps } from './core'

export type SaveExcalidrawSnapshot = (
  snapshot: object,
  existingRef?: string,
) => Promise<string>

// Admin-safe alias so consumers don't need to depend on React-bound types
export type ImageUpload = NonNullable<RichEditorProps['imageUpload']>

export type VideoUpload = (
  file: File,
  opts?: { onProgress?: (percent: number) => void },
) => Promise<{ src: string }>

export type FileUpload = (
  file: File,
  opts?: { onProgress?: (percent: number) => void },
) => Promise<{ src: string }>

export type AgentLoopHandle = ReturnType<typeof useAgentLoop>

export type AgentLitexmlRegistryProvider = LitexmlRegistryProvider
