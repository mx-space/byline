interface ContentIndexed<T extends string> {
  type: T
  contentIndex: number
}

export type AiAgentSseEvent =
  | ContentIndexed<'text_start'>
  | (ContentIndexed<'text_delta'> & { delta: string })
  | ContentIndexed<'text_end'>
  | ContentIndexed<'thinking_start'>
  | (ContentIndexed<'thinking_delta'> & { delta: string })
  | ContentIndexed<'thinking_end'>
  | (ContentIndexed<'toolcall_start'> & { name?: string })
  | (ContentIndexed<'toolcall_delta'> & {
      partialArgs: Record<string, unknown>
    })
  | (ContentIndexed<'toolcall_end'> & {
      toolCall: {
        id: string
        name: string
        arguments: Record<string, unknown>
      }
    })
  | { type: 'done'; message: Record<string, unknown> }
  | { type: 'error'; reason: 'error' | 'aborted'; message: string }
