import { createHash } from 'node:crypto'

import { $toMarkdown, allHeadlessNodes } from '@haklex/rich-headless'
import { createHeadlessEditor } from '@lexical/headless'
import { registerList } from '@lexical/list'
import type { ElementNode, TextNode } from 'lexical'
import {
  $getNodeByKey,
  $isElementNode,
  $isRootOrShadowRoot,
  $isTextNode,
} from 'lexical'

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

const isRecordWithState = (value: unknown) =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.values(value).some(isState)

const normalizeNested = (node: LexicalNode): LexicalNode => {
  const out: LexicalNode = { ...node }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'children' && Array.isArray(value)) {
      out.children = (value as LexicalNode[]).map(normalizeNested)
    } else if (isState(value)) {
      out[key] = normalizeState(value).state
    } else if (Array.isArray(value) && value.length && value.every(isState)) {
      out[key] = value.map((item) => normalizeState(item).state)
    } else if (Array.isArray(value) && value.some(isRecordWithState)) {
      out[key] = value.map((item) =>
        isRecordWithState(item) ? normalizeNested(item as LexicalNode) : item,
      )
    }
  }
  return out
}

export interface NormalizedState {
  state: LexicalState
  markdown: string
}

const $firstText = (element: ElementNode): TextNode | null => {
  for (const child of element.getChildren()) {
    if ($isTextNode(child)) return child
    if ($isElementNode(child)) {
      const text = $firstText(child)
      if (text) return text
    }
  }
  return null
}

// The editor's BlockIdPlugin mints random ids for top-level blocks that lack
// one, which turns opening an imported post into an edit. Ids derived from the
// block content keep repeated imports byte-identical.
const withBlockIds = (state: LexicalState): LexicalState => {
  const used = new Set<string>()
  const children = (state.root.children ?? []).map((child) => {
    const current = (child.$ as { blockId?: unknown } | undefined)?.blockId
    let id = typeof current === 'string' && current ? current : ''
    for (let salt = 0; !id || used.has(id); salt++) {
      id = createHash('sha256')
        .update(`${salt}:${JSON.stringify({ ...child, $: undefined })}`)
        .digest('base64url')
        .slice(0, 8)
    }
    used.add(id)
    return { ...child, $: { ...(child.$ as object), blockId: id } }
  })
  return { ...state, root: { ...state.root, children } }
}

export const normalizeState = (
  input: LexicalState,
  options: { blockIds?: boolean } = {},
): NormalizedState => {
  const prepared = normalizeNested(input.root) as LexicalState['root']
  const editor = createEditor()
  editor.setEditorState(editor.parseEditorState({ root: prepared } as never))
  // The editor's ListPlugin dirties nodes on load, and the DOM reconciler then
  // copies each dirty element's first text format onto it. Headless has no
  // reconciler, so both steps are replayed here to store what the editor saves.
  const dirty = new Set<string>()
  const unregister = editor.registerUpdateListener(({ dirtyElements }) => {
    for (const key of dirtyElements.keys()) dirty.add(key)
  })
  registerList(editor)
  editor.update(() => {}, { discrete: true })
  unregister()
  editor.update(
    () => {
      for (const key of dirty) {
        const node = $getNodeByKey(key)
        if (!$isElementNode(node) || $isRootOrShadowRoot(node)) continue
        const text = $firstText(node)
        if (!text) continue
        if (node.getTextFormat() !== text.getFormat())
          node.setTextFormat(text.getFormat())
        if (node.getTextStyle() !== text.getStyle())
          node.setTextStyle(text.getStyle())
      }
    },
    { discrete: true },
  )
  const exported = editor.getEditorState().toJSON() as unknown as LexicalState
  const state = options.blockIds ? withBlockIds(exported) : exported
  const markdown = editor.getEditorState().read(() => $toMarkdown())
  return { state, markdown }
}
