// @vitest-environment happy-dom

import {
  DynamicEditNode,
  INSERT_DYNAMIC_COMMAND,
} from '@haklex/rich-ext-dynamic'
import type { LexicalEditor } from 'lexical'
import { $getRoot, createEditor } from 'lexical'
import { describe, expect, it } from 'vitest'

import {
  $applyCatalogEntry,
  $createBylineDynamicEditNode,
  BylineDynamicEditNode,
} from './BylineDynamicEditNode'
import { filterCatalogEntries } from './catalog-picker'
import { registerDynamicInsertCommand } from './insert-command'

function newEditor(): LexicalEditor {
  return createEditor({
    nodes: [BylineDynamicEditNode],
    onError: (error) => {
      throw error
    },
  })
}

const stored = {
  type: 'dynamic',
  version: 1,
  url: 'https://cdn.example/ring.js',
  props: { value: 9 },
  initialHeight: 144,
}

function firstNode(editor: LexicalEditor) {
  return editor.getEditorState().read(() => $getRoot().getFirstChild())
}

describe('BylineDynamicEditNode', () => {
  it('loads stored dynamic nodes as the Byline subclass and saves them unchanged', () => {
    const editor = newEditor()
    editor.setEditorState(
      editor.parseEditorState({
        root: {
          type: 'root',
          version: 1,
          children: [stored],
          direction: null,
          format: '',
          indent: 0,
        },
      }),
    )

    expect(firstNode(editor)).toBeInstanceOf(BylineDynamicEditNode)
    expect(firstNode(editor)).toBeInstanceOf(DynamicEditNode)
    expect(editor.getEditorState().toJSON().root.children[0]).toMatchObject(
      stored,
    )
  })

  it('inserts an empty Byline node from the slash item', () => {
    const editor = newEditor()
    const [item] = BylineDynamicEditNode.commandItems
    editor.update(() => $getRoot().selectEnd(), { discrete: true })

    item.onSelect(editor)
    editor.update(() => {}, { discrete: true })

    const node = firstNode(editor)
    expect(node).toBeInstanceOf(BylineDynamicEditNode)
    expect(
      editor
        .getEditorState()
        .read(() => (node as BylineDynamicEditNode).getUrl()),
    ).toBe('')
  })

  it('handles INSERT_DYNAMIC_COMMAND with a Byline node', () => {
    const editor = newEditor()
    registerDynamicInsertCommand(editor)
    editor.update(() => $getRoot().selectEnd(), { discrete: true })

    editor.update(
      () => {
        editor.dispatchCommand(INSERT_DYNAMIC_COMMAND, {
          url: stored.url,
          props: stored.props,
          initialHeight: 200,
        })
      },
      { discrete: true },
    )

    expect(editor.getEditorState().toJSON().root.children[0]).toMatchObject({
      type: 'dynamic',
      url: stored.url,
      props: stored.props,
      initialHeight: 200,
    })
    expect(firstNode(editor)).toBeInstanceOf(BylineDynamicEditNode)
  })

  it('applies a catalog entry: url, height and props from schema defaults', () => {
    const editor = newEditor()
    editor.update(
      () => {
        const node = $createBylineDynamicEditNode()
        $getRoot().append(node)
        $applyCatalogEntry(node, {
          name: 'Ring',
          description: '',
          url: stored.url,
          initialHeight: 144,
          propsSchema: {
            properties: {
              label: { type: 'string', default: 'Goal' },
              value: { type: 'number' },
            },
          },
        })
      },
      { discrete: true },
    )

    expect(editor.getEditorState().toJSON().root.children[0]).toMatchObject({
      url: stored.url,
      initialHeight: 144,
      props: { label: 'Goal' },
    })
  })
})

describe('filterCatalogEntries', () => {
  const entries = [
    {
      name: 'ProgressRing',
      description: 'Circular progress',
      url: 'a',
      initialHeight: 1,
      propsSchema: {},
    },
    {
      name: 'Timeline',
      description: 'Dated events',
      url: 'b',
      initialHeight: 1,
      propsSchema: {},
    },
  ]

  it('returns every entry for an empty query', () => {
    expect(filterCatalogEntries(entries, '  ')).toEqual(entries)
  })

  it('matches name or description, ignoring case', () => {
    expect(filterCatalogEntries(entries, 'ring').map((e) => e.name)).toEqual([
      'ProgressRing',
    ])
    expect(filterCatalogEntries(entries, 'EVENTS').map((e) => e.name)).toEqual([
      'Timeline',
    ])
  })
})
