import { describe, expect, it } from 'vitest'

import { convertMdx, parseComponentMap } from '../src'
import type { LexicalNode } from '../src/mdx/lexical-nodes'

const lobeLikeMap = parseComponentMap({
  components: {
    Callout: {
      node: 'banner',
      props: {
        bannerType: {
          from: 'type',
          map: { info: 'note', warning: 'warning' },
          default: 'note',
        },
      },
      children: { state: 'content' },
    },
    Cards: {
      node: 'grid-container',
      props: { cols: { value: 2 } },
      children: { cells: 'cells' },
    },
    Card: { node: 'link-card', props: { url: 'href', title: 'title' } },
    Image: {
      node: 'image',
      props: {
        src: 'src',
        altText: { from: 'alt', default: '' },
        height: { from: 'height', type: 'number' },
      },
    },
    X: {
      node: 'embed',
      props: {
        url: { template: 'https://x.com/i/status/{id}' },
        source: { value: 'tweet' },
      },
    },
    Chart: {
      dynamic: {
        url: 'https://cdn.test/chart.mjs',
        initialHeight: 480,
        props: { dataUrl: 'src' },
      },
    },
    Steps: { unwrap: true },
    Ad: { skip: true },
  },
})

const blocks = (source: string, map = lobeLikeMap) => {
  const result = convertMdx(source, { componentMap: map })
  return { ...result, nodes: result.state.root.children as LexicalNode[] }
}

const texts = (node: LexicalNode): string =>
  node.type === 'text'
    ? String(node.text)
    : (node.children ?? []).map(texts).join('')

describe('convertMdx markdown', () => {
  it('reads frontmatter and converts common markdown', () => {
    const { frontmatter, nodes, markdown } = blocks(`---
title: Hello
author:
  - ada
---

# Title

Some **bold**, *italic*, \`code\` and [a link](https://a.test "t").

- one
  - nested
- two

1. first
2. second

- [x] done

\`\`\`ts
const a = 1
\`\`\`

| a | b |
| - | - |
| 1 | 2 |

> quoted
>
> twice

---
`)
    expect(frontmatter).toEqual({ title: 'Hello', author: ['ada'] })
    expect(nodes.map((node) => node.type)).toEqual([
      'heading',
      'paragraph',
      'list',
      'list',
      'list',
      'code-block',
      'table',
      'quote',
      'horizontalrule',
    ])
    const paragraph = nodes[1].children!
    expect(paragraph.find((node) => node.text === 'bold')?.format).toBe(1)
    expect(paragraph.find((node) => node.text === 'italic')?.format).toBe(2)
    expect(paragraph.find((node) => node.text === 'code')?.format).toBe(16)
    expect(paragraph.find((node) => node.type === 'link')).toMatchObject({
      url: 'https://a.test',
      title: 't',
    })
    const bullet = nodes[2]
    expect(bullet.listType).toBe('bullet')
    expect(bullet.children![1].children![0]).toMatchObject({ type: 'list' })
    expect(nodes[3]).toMatchObject({ listType: 'number', tag: 'ol' })
    expect(nodes[4].children![0]).toMatchObject({ checked: true })
    expect(nodes[5]).toMatchObject({ code: 'const a = 1', language: 'ts' })
    expect(nodes[6].children![0].children![0]).toMatchObject({
      headerState: 1,
    })
    expect(texts(nodes[7])).toBe('quotedtwice')
    expect(markdown).toContain('# Title')
  })

  it('lifts images out of paragraphs and keeps the surrounding text', () => {
    const { nodes } = blocks('before ![alt](https://img.test/a.png) after')
    expect(nodes.map((node) => node.type)).toEqual([
      'paragraph',
      'image',
      'paragraph',
    ])
    expect(nodes[1]).toMatchObject({
      src: 'https://img.test/a.png',
      altText: 'alt',
    })
  })

  it('turns GitHub alerts into alert-quote nodes', () => {
    const { nodes } = blocks('> [!WARNING]\n> Careful here')
    expect(nodes[0]).toMatchObject({
      type: 'alert-quote',
      alertType: 'warning',
    })
    const content = nodes[0].content as { root: LexicalNode }
    expect(texts(content.root)).toBe('Careful here')
  })

  it('joins CJK soft line breaks without a space', () => {
    const { nodes } = blocks('中文第一行\n中文第二行\nand English\nwords')
    expect(texts(nodes[0])).toBe('中文第一行中文第二行 and English words')
  })

  it('keeps a space at Korean soft line breaks', () => {
    const { nodes } = blocks('정책을\n참조하십시오')
    expect(texts(nodes[0])).toBe('정책을 참조하십시오')
  })

  it('keeps the link of a linked image as a text link below it', () => {
    const { nodes, issues } = blocks(
      '[![Product Hunt badge](https://img.example/badge.svg)](https://ph.example/p)',
    )
    expect(nodes.map((node) => node.type)).toEqual(['image', 'paragraph'])
    expect(nodes[1].children![0]).toMatchObject({
      type: 'link',
      url: 'https://ph.example/p',
    })
    expect(texts(nodes[1])).toBe('Product Hunt badge')
    expect(issues).toEqual([])
  })

  it('keeps the link of an html anchor around an image', () => {
    const { nodes, issues } =
      blocks(`<a href="https://ph.example/p" target="_blank">
  <img alt="PH badge" src="https://img.example/badge.svg" />
</a>`)
    expect(nodes.map((node) => node.type)).toEqual(['image', 'paragraph'])
    expect(nodes[1].children![0]).toMatchObject({
      type: 'link',
      url: 'https://ph.example/p',
    })
    expect(texts(nodes[1])).toBe('PH badge')
    expect(issues).toEqual([])
  })

  it('collects footnotes into a footnote section', () => {
    const { nodes } = blocks('Claim[^1].\n\n[^1]: Source text')
    expect(nodes[0].children!.some((node) => node.type === 'footnote')).toBe(
      true,
    )
    expect(nodes.at(-1)).toMatchObject({
      type: 'footnote-section',
      definitions: { '1': 'Source text' },
    })
  })
})

describe('convertMdx components', () => {
  it('maps a component with nested editor state children', () => {
    const { nodes } = blocks(`<Callout type={'warning'}>
  Read **this** first.
</Callout>

<Callout type="info">Inline body</Callout>`)
    expect(nodes[0]).toMatchObject({ type: 'banner', bannerType: 'warning' })
    const content = nodes[0].content as { root: LexicalNode }
    expect(texts(content.root)).toBe('Read this first.')
    expect(nodes[1]).toMatchObject({ bannerType: 'note' })
    expect(texts((nodes[1].content as { root: LexicalNode }).root)).toBe(
      'Inline body',
    )
  })

  it('maps grid cells, templated props and numeric props', () => {
    const { nodes, components } = blocks(`<Cards>
  <Card href={'https://a.test'} title={'A'} />

  <Card href="https://b.test" title="B" />
</Cards>

<X id={'123'} />

<Image alt={'Pic'} height={457} inStep src={'https://img.test/p.webp'} />`)
    const cells = nodes[0].cells as Array<{ root: LexicalNode }>
    expect(nodes[0]).toMatchObject({ type: 'grid-container', cols: 2 })
    expect(cells.map((cell) => cell.root.children![0])).toMatchObject([
      { type: 'link-card', url: 'https://a.test', title: 'A' },
      { type: 'link-card', url: 'https://b.test', title: 'B' },
    ])
    expect(nodes[1]).toMatchObject({
      type: 'embed',
      url: 'https://x.com/i/status/123',
      source: 'tweet',
    })
    expect(nodes[2]).toMatchObject({
      type: 'image',
      height: 457,
      altText: 'Pic',
    })
    expect(components).toEqual({ Cards: 1, Card: 2, X: 1, Image: 1 })
  })

  it('maps dynamic components and reports dropped children', () => {
    const { nodes, issues } = blocks(
      '<Chart src="https://data.test/x.json" theme="dark">caption text</Chart>',
    )
    expect(nodes[0]).toEqual({
      type: 'dynamic',
      version: 1,
      url: 'https://cdn.test/chart.mjs',
      initialHeight: 480,
      props: { dataUrl: 'https://data.test/x.json' },
    })
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'dropped-node', component: 'Chart' }),
    ])
  })

  it('unwraps and skips components', () => {
    const { nodes } = blocks(`<Steps>
  ### Step 1

  Do it.
</Steps>

<Ad slot="1" />`)
    expect(nodes.map((node) => node.type)).toEqual(['heading', 'paragraph'])
  })

  it('handles unknown components according to the policy', () => {
    const source = 'Intro\n\n<Widget size={2} label="x">hello</Widget>'
    const placeholder = blocks(source)
    expect(placeholder.nodes[1]).toMatchObject({
      type: 'dynamic',
      url: 'urn:byline:unmapped-component:Widget',
      props: {
        component: 'Widget',
        props: { size: 2, label: 'x' },
        children: 'hello',
      },
    })
    expect(placeholder.issues[0]).toMatchObject({
      kind: 'unmapped-component',
      component: 'Widget',
      line: 3,
    })

    const skip = blocks(source, parseComponentMap({ unknown: 'skip' }))
    expect(skip.nodes.map((node) => node.type)).toEqual(['paragraph'])

    const unwrap = blocks(source, parseComponentMap({ unknown: 'unwrap' }))
    expect(texts(unwrap.nodes[1])).toBe('hello')
  })

  it('reports props that cannot be evaluated and dropped esm', () => {
    const { nodes, issues } = blocks(`import Foo from './foo'

<Image src={url} alt="a" />

{/* a comment */}`)
    expect(nodes[0]).toMatchObject({ type: 'image', altText: 'a' })
    expect(issues.map((issue) => issue.kind).sort()).toEqual([
      'esm',
      'unresolved-prop',
    ])
  })

  it('converts inline html elements', () => {
    const { nodes } = blocks(
      'Go <a href="https://a.test">here</a><br/>now <kbd>Ctrl</kbd>',
    )
    const children = nodes[0].children!
    expect(children.map((node) => node.type)).toEqual([
      'text',
      'link',
      'linebreak',
      'text',
      'text',
    ])
    expect(children.at(-1)).toMatchObject({ text: 'Ctrl', format: 16 })
  })

  it('keeps the link of a block-level anchor around text', () => {
    const { nodes, issues } = blocks(
      '<Callout type="tip">\n  <a href="https://a.test/docs">\n    Read the docs\n  </a>\n</Callout>\n',
    )
    const inner = (nodes[0].content as { root: LexicalNode }).root
      .children![0] as LexicalNode
    expect(inner.type).toBe('paragraph')
    expect(inner.children![0]).toMatchObject({
      type: 'link',
      url: 'https://a.test/docs',
    })
    expect(texts(inner)).toBe('Read the docs')
    expect(issues).toEqual([])
  })

  it('keeps image attributes when a link wraps the image', () => {
    const { nodes, issues } = blocks(
      '<a href="https://ph.test">\n  <img alt="Badge" src="https://img.test/b.svg" width="250" />\n</a>\n\n[![Shot](https://img.test/s.png)](https://shot.test)\n',
    )
    expect(nodes.map((node) => node.type)).toEqual([
      'image',
      'paragraph',
      'image',
      'paragraph',
    ])
    expect(nodes[0]).toMatchObject({
      src: 'https://img.test/b.svg',
      width: 250,
    })
    expect(nodes[3].children![0]).toMatchObject({ url: 'https://shot.test' })
    expect(issues).toEqual([])
  })
})

describe('parseComponentMap', () => {
  it('rejects ambiguous mappings', () => {
    expect(() =>
      parseComponentMap({ components: { A: { node: 'image', skip: true } } }),
    ).toThrow(/exactly one/)
  })
})
