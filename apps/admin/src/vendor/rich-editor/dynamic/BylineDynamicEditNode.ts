import type { DynamicNodePayload } from '@haklex/rich-ext-dynamic'
import { DynamicEditNode, DynamicNode } from '@haklex/rich-ext-dynamic'
import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical'
import { $insertNodes } from 'lexical'
import type { ReactElement } from 'react'
import { createElement, lazy, Suspense } from 'react'

import type { DynamicCatalogEntry } from '~/api/dynamic-components'
import { samplePropsFromSchema } from '~/lib/dynamic-props'

const LazyDynamicNodeEditor = lazy(() =>
  import('./DynamicNodeEditor').then((m) => ({ default: m.DynamicNodeEditor })),
)

export class BylineDynamicEditNode extends DynamicEditNode {
  static commandItems = DynamicEditNode.commandItems.map((item) => ({
    ...item,
    onSelect: (editor: LexicalEditor) => {
      editor.update(() => {
        $insertNodes([$createBylineDynamicEditNode()])
      })
    },
  }))

  static getType(): string {
    return 'dynamic'
  }

  static clone(node: BylineDynamicEditNode): BylineDynamicEditNode {
    return new BylineDynamicEditNode(
      node.__url,
      node.__props,
      node.__initialHeight,
      node.__key,
    )
  }

  constructor(
    url: string,
    props: Record<string, unknown> = {},
    initialHeight = 320,
    key?: NodeKey,
  ) {
    super(url, props, initialHeight, key)
  }

  static importJSON(
    serializedNode: SerializedLexicalNode & Record<string, unknown>,
  ): BylineDynamicEditNode {
    return new BylineDynamicEditNode(
      serializedNode.url as string,
      serializedNode.props as Record<string, unknown>,
      serializedNode.initialHeight as number,
    ).updateFromJSON(serializedNode)
  }

  decorate(editor: LexicalEditor, config: EditorConfig): ReactElement {
    if (!editor.isEditable())
      return DynamicNode.prototype.decorate.call(this, editor, config)
    return createElement(
      Suspense,
      {
        fallback: createElement('div', {
          style: { margin: '1.25rem 0', minHeight: this.__initialHeight },
        }),
      },
      createElement(LazyDynamicNodeEditor, {
        componentProps: this.__props,
        initialHeight: this.__initialHeight,
        nodeKey: this.__key,
        url: this.__url,
      }),
    )
  }
}

export function $createBylineDynamicEditNode(
  payload: Partial<DynamicNodePayload> = {},
): BylineDynamicEditNode {
  return new BylineDynamicEditNode(
    payload.url ?? '',
    payload.props ?? {},
    payload.initialHeight ?? 320,
  )
}

export function $applyCatalogEntry(
  node: DynamicNode,
  entry: DynamicCatalogEntry,
) {
  node.setUrl(entry.url)
  node.setInitialHeight(entry.initialHeight)
  node.setProps(samplePropsFromSchema(entry.propsSchema))
}
