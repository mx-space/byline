import { $toMarkdown, allHeadlessNodes } from '@haklex/rich-headless'
import { createHeadlessEditor } from '@lexical/headless'

import type { ComponentMap } from './component-map'
import type { LexicalNode, LexicalState } from './lexical-nodes'

const createEditor = () =>
  createHeadlessEditor({
    nodes: allHeadlessNodes,
    onError: (error) => {
      throw error
    },
  })

const NATIVE_ELEMENT_TYPES = ['root', 'paragraph', 'text', 'linebreak', 'tab']

export const knownNodeTypes = (): Set<string> =>
  new Set([
    ...NATIVE_ELEMENT_TYPES,
    ...allHeadlessNodes.map((node) => node.getType()),
  ])

export const assertMappableNodeTypes = (map: ComponentMap) => {
  const known = knownNodeTypes()
  for (const [name, mapping] of Object.entries(map.components)) {
    if ('node' in mapping && !known.has(mapping.node)) {
      throw new Error(
        `components.${name}.node "${mapping.node}" is not a haklex node type. Known: ${[...known].sort().join(', ')}`,
      )
    }
  }
}

const isState = (value: unknown): value is LexicalState =>
  !!value &&
  typeof value === 'object' &&
  (value as LexicalState).root?.type === 'root'

const normalizeNested = (node: LexicalNode): LexicalNode => {
  const out: LexicalNode = { ...node }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'children' && Array.isArray(value)) {
      out.children = (value as LexicalNode[]).map(normalizeNested)
    } else if (isState(value)) {
      out[key] = normalizeState(value).state
    } else if (Array.isArray(value) && value.length && value.every(isState)) {
      out[key] = value.map((item) => normalizeState(item).state)
    }
  }
  return out
}

export interface NormalizedState {
  state: LexicalState
  markdown: string
}

export const normalizeState = (input: LexicalState): NormalizedState => {
  const prepared = normalizeNested(input.root) as LexicalState['root']
  const editor = createEditor()
  editor.setEditorState(editor.parseEditorState({ root: prepared } as never))
  const state = editor.getEditorState().toJSON() as unknown as LexicalState
  const markdown = editor.getEditorState().read(() => $toMarkdown())
  return { state, markdown }
}
