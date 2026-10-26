import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { BylineClient, DraftBranch } from '@mx-space/byline-api-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildContent } from '../src/writing/content'
import { applyPatch, Directory, toWriteData } from '../src/writing/fields'
import { formatDiscarded } from '../src/writing/format'
import { readWriteInput } from '../src/writing/input'

let dir: string
const envelopePath = () => path.join(dir, 'post.xml')

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'byline-writing-'))
  await writeFile(
    envelopePath(),
    `<mxpost>
  <meta>
    <title>Envelope title</title>
    <slug>envelope-slug</slug>
    <category>engineering</category>
    <tags><tag>a</tag><tag>b</tag></tags>
    <authors><author>ada</author><author>grace</author></authors>
    <state>draft</state>
  </meta>
  <content>
<p>Hello <strong>world</strong></p>
  </content>
</mxpost>`,
  )
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

const client = {
  categories: {
    list: async () => ({
      data: [{ id: '10', slug: 'engineering', name: 'Engineering', type: 0 }],
    }),
  },
  users: {
    listAll: async () => [
      {
        id: '1',
        username: 'ada',
        email: 'ada@example.com',
        displayName: 'Ada',
      },
      { id: '2', username: 'grace', email: null, displayName: 'Grace' },
    ],
  },
} as unknown as BylineClient

describe('readWriteInput', () => {
  it('reads an mxpost envelope, including authors', async () => {
    const input = await readWriteInput({ file: envelopePath() })
    expect(input.fields).toEqual({
      title: 'Envelope title',
      slug: 'envelope-slug',
      category: 'engineering',
      tags: ['a', 'b'],
      authors: ['ada', 'grace'],
    })
    expect(input.body?.text).toBe('Hello **world**')
  })

  it('lets flags override the envelope', async () => {
    const input = await readWriteInput({
      file: envelopePath(),
      title: 'Flag title',
      authors: 'grace, ada',
      content: '# Heading\n\nFrom flags',
      format: 'markdown',
    })
    expect(input.fields.title).toBe('Flag title')
    expect(input.fields.authors).toEqual(['grace', 'ada'])
    expect(input.body?.text).toBe('# Heading\n\nFrom flags')
  })

  it('reads the body from a file spec', async () => {
    const file = path.join(dir, 'body.xml')
    await writeFile(file, '<p>From file</p>')
    const input = await readWriteInput({ content: `file=${file}` })
    expect(input.body?.text).toBe('From file')
  })

  it('refuses to publish', async () => {
    await expect(
      readWriteInput({ title: 'x', state: 'publish' }),
    ).rejects.toThrow('only writes drafts')
  })

  it('rejects an unknown format', async () => {
    await expect(
      readWriteInput({ content: 'x', format: 'html' }),
    ).rejects.toThrow('--format')
  })
})

describe('buildContent', () => {
  it('stores LiteXML as Lexical with block ids', () => {
    const { content } = buildContent('<p>One</p><h2>Two</h2>', 'lexical')
    const state = JSON.parse(content)
    expect(
      state.root.children.map((node: { type: string }) => node.type),
    ).toEqual(['paragraph', 'heading'])
    expect(state.root.children[0].$.blockId).toBeTypeOf('string')
  })

  it('rejects empty content', () => {
    expect(() => buildContent('  ', 'lexical')).toThrow('empty')
  })
})

describe('toWriteData', () => {
  it('resolves the category and the ordered byline', async () => {
    const data = await toWriteData(
      {
        title: 'T',
        category: 'Engineering',
        authors: ['grace', 'ada@example.com', '2'],
      },
      { content: '{}', text: '' },
      new Directory(client),
    )
    expect(data.typeSpecificData).toEqual({
      categoryId: '10',
      authors: ['2', '1'],
    })
  })

  it('fails on an unknown author', async () => {
    await expect(
      toWriteData({ authors: ['nobody'] }, null, new Directory(client)),
    ).rejects.toThrow('Unknown author "nobody"')
  })

  it('keeps the head revision for fields not given', () => {
    const merged = applyPatch(
      {
        title: 'Old',
        text: 'old body',
        content: '{"root":{}}',
        contentFormat: 'lexical',
        images: null,
        meta: null,
        typeSpecificData: { slug: 'kept', authors: ['1'] },
      },
      { contentFormat: 'lexical', typeSpecificData: { authors: ['2', '1'] } },
    )
    expect(merged).toMatchObject({
      title: 'Old',
      text: 'old body',
      typeSpecificData: { slug: 'kept', authors: ['2', '1'] },
    })
  })
})

describe('formatDiscarded', () => {
  const draft = (relation: DraftBranch['relation'], refId: string | null) =>
    ({
      document: { refId },
      headRevision: { title: 'Notes' },
      id: 'd1',
      relation,
    }) as unknown as DraftBranch

  it('says a fresh draft is gone for good', () => {
    expect(formatDiscarded(draft('fresh', null))).toBe(
      'Deleted draft d1 (Notes)',
    )
  })

  it('says unpublished changes were dropped and the post kept', () => {
    expect(formatDiscarded(draft('ahead', '7'))).toBe(
      'Discarded unpublished changes to post 7 (Notes); the published post is unchanged',
    )
  })
})
