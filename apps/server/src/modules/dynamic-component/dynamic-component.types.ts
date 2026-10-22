export interface DynamicComponentRow {
  id: string
  name: string
  description: string
  url: string
  initialHeight: number
  propsSchema: Record<string, unknown>
  parentUrl: string | null
  createdBy: string | null
  createdAt: Date
}

export interface DynamicComponentUpsertInput {
  name: string
  description: string
  url: string
  initialHeight: number
  propsSchema: Record<string, unknown>
  parentUrl: string | null
}
