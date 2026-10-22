import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createClient } from '@mx-space/byline-api-client'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  canonicalLocale,
  executeImport,
  loadImportConfig,
  planImport,
  scanContent,
} from '../src'

let root: string

const post = (front: string, body: string) => `---\n${front}\n---\n\n${body}\n`

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'byline-import-'))
  const write = async (rel: string, content: string) => {
    const file = path.join(root, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content)
  }
  await write(
    'news/hello-world/index.mdx',
    post(
      [
        'title: Hello',
        'date: 2024-06-19T00:00:00.000Z',
        'image: ./cover.png',
        'author:',
        '  - ada',
        '  - grace',
        'seo:',
        '  description: Greeting',
        '  tags: [intro]',
      ].join('\n'),
      'Hello **world**\n\n<Callout type="tip">Note</Callout>',
    ),
  )
  await write('news/hello-world/cover.png', 'png')
  await write(
    'news/hello-world/index.zh.mdx',
    post(
      [
        'title: 你好',
        'seo:',
        '  title: 你好 SEO',
        '  description: 问候',
        '  image: ./cover.png',
        '  tags: [介绍]',
      ].join('\n'),
      '你好世界',
    ),
  )
  await write(
    'news/hello-world/index.pt_br.mdx',
    post('title: Olá', 'Olá mundo'),
  )
  await write('guides/setup.mdx', post('title: Setup', 'Install it.'))
  await write('guides/setup.fr.mdx', post('title: Installation', 'Installez.'))
  await write('orphan/index.de.mdx', post('title: Nur Deutsch', 'Text'))
  await write(
    'byline.import.json',
    JSON.stringify({
      localeAliases: { zh: 'zh-CN' },
      components: {
        Callout: {
          node: 'banner',
          props: { bannerType: 'type' },
          children: { state: 'content' },
        },
      },
      authors: { ada: { displayName: 'Ada Lovelace', bio: 'Math' } },
      categories: { news: { name: 'News' } },
    }),
  )
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('scanContent', () => {
  it('groups folder and single-file posts with their locales', async () => {
    const posts = await scanContent(root, {
      sourceLocale: 'en',
      localeAliases: { zh: 'zh-CN' },
    })
    const byKey = Object.fromEntries(posts.map((item) => [item.key, item]))
    expect(Object.keys(byKey).sort()).toEqual([
      'guides/setup',
      'news/hello-world',
      'orphan',
    ])
    expect(
      byKey['news/hello-world'].translations.map((t) => t.locale).sort(),
    ).toEqual(['pt-BR', 'zh-CN'])
    expect(byKey['guides/setup']).toMatchObject({
      slug: 'setup',
      pathCategory: 'guides',
    })
    expect(byKey.orphan.source).toBeUndefined()
  })

  it('canonicalises locale casing', () => {
    expect(canonicalLocale('zh_hant_tw')).toBe('zh-Hant-TW')
    expect(canonicalLocale('vi-vn')).toBe('vi-VN')
  })
})

interface Recorded {
  method: string
  path: string
  body: any
}

const fakeServer = () => {
  const calls: Recorded[] = []
  const users: any[] = [
    { id: '1', username: 'grace', display_name: 'Grace Hopper' },
  ]
  const posts = new Map<string, any>()
  const categories: any[] = []
  let nextId = 100
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(status >= 400 ? data : { data }), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  const fetch = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input)
    const method = init.method ?? 'GET'
    const body =
      typeof init.body === 'string' ? JSON.parse(init.body) : init.body
    calls.push({ method, path: url.pathname, body })
    const route = `${method} ${url.pathname}`
    if (route === 'GET /users') {
      return new Response(
        JSON.stringify({
          data: users,
          meta: {
            pagination: { page: 1, size: 100, total: 1, total_pages: 1 },
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    }
    if (route === 'POST /users/profile-only') {
      const user = { id: String(nextId++), display_name: body.displayName }
      users.push({ ...user, username: body.username })
      return json(user)
    }
    if (route === 'GET /categories') return json(categories)
    if (route === 'POST /categories') {
      const category = {
        id: String(nextId++),
        name: body.name,
        slug: body.slug,
      }
      categories.push(category)
      return json(category)
    }
    if (url.pathname.startsWith('/posts/get-url/')) {
      const slug = url.pathname.split('/').pop()!
      return posts.has(slug)
        ? json({ path: `/cat/${slug}` })
        : json({ error: { code: 'POST_NOT_FOUND', message: 'nope' } }, 404)
    }
    if (method === 'GET' && url.pathname.startsWith('/posts/cat/')) {
      return json(posts.get(url.pathname.split('/').pop()!))
    }
    if (route === 'POST /drafts') {
      const id = body.refId ?? String(nextId++)
      const data = body.data
      posts.set(data.typeSpecificData.slug, { id, meta: data.meta })
      return json({
        id: `d${id}`,
        head_revision_id: `r${id}`,
        relation_to_published: body.refId ? 'descendant' : null,
        document: {
          ref_id: body.refId ?? null,
          published_revision_id: body.refId ? 'p1' : null,
        },
        _postId: id,
      })
    }
    if (url.pathname.startsWith('/drafts/context/post/')) {
      return json({
        published_revision: {
          id: 'p1',
          title: 'x',
          text: '',
          content: '{}',
          type_specific_data: {},
        },
      })
    }
    if (route === 'POST /publish-jobs') {
      return json({ task_id: `t-${body.branchId.slice(1)}`, created: true })
    }
    if (url.pathname.startsWith('/tasks/')) {
      const postId = url.pathname.split('-').pop()
      return json({
        id: 't',
        status: 'completed',
        result: { article_id: postId },
      })
    }
    if (method === 'PUT' && url.pathname.startsWith('/ai/translations/')) {
      return json({ id: 'tr', is_locked: true })
    }
    if (route === 'POST /files/upload') {
      return json({ url: 'https://cdn.test/cover.png', name: 'cover.png' })
    }
    return json({ error: { code: 'UNEXPECTED', message: route } }, 500)
  })
  return {
    calls,
    client: createClient({
      endpoint: 'http://byline.test',
      apiKey: 'k',
      fetch: fetch as unknown as typeof globalThis.fetch,
    }),
  }
}

describe('import', () => {
  const load = () =>
    loadImportConfig({ configPath: path.join(root, 'byline.import.json') })

  it('plans posts, locales, authors and issues offline', async () => {
    const config = await load()
    const plan = await planImport(root, config)
    const hello = plan.find((item) => item.key === 'news/hello-world')!
    expect(hello).toMatchObject({
      slug: 'hello-world',
      category: 'news',
      title: 'Hello',
      summary: 'Greeting',
      tags: ['intro'],
      authorKeys: ['ada', 'grace'],
      createdAt: '2024-06-19T00:00:00.000Z',
    })
    expect(hello.translations.map((t) => [t.locale, t.title, t.seo])).toEqual([
      ['pt-BR', 'Olá', undefined],
      [
        'zh-CN',
        '你好',
        { title: '你好 SEO', description: '问候', image: './cover.png' },
      ],
    ])
    expect(plan.find((item) => item.key === 'orphan')?.skipReason).toBe(
      'no en source file',
    )

    const result = await executeImport(plan, config, {
      root,
      client: null,
      dryRun: true,
    })
    expect(result.outcomes.map((o) => [o.key, o.action])).toEqual([
      ['guides/setup', 'create'],
      ['news/hello-world', 'create'],
      ['orphan', 'skip'],
    ])
    expect(result.outcomes[1].localAssets).toBe(0)
  })

  it('imports through the API and is idempotent by slug', async () => {
    const config = await load()
    const plan = await planImport(root, config)
    const { client, calls } = fakeServer()

    const first = await executeImport(plan, config, {
      root,
      client,
      dryRun: false,
      preserveDates: true,
    })
    expect(first.outcomes.map((o) => o.action)).toEqual([
      'create',
      'create',
      'skip',
    ])
    expect(first.authors).toEqual([
      expect.objectContaining({ key: 'ada', action: 'create' }),
      expect.objectContaining({ key: 'grace', action: 'existing', id: '1' }),
    ])

    const profile = calls.find((call) => call.path === '/users/profile-only')
    expect(profile?.body).toMatchObject({
      displayName: 'Ada Lovelace',
      username: 'ada',
      bio: 'Math',
    })
    const draft = calls.find(
      (call) =>
        call.path === '/drafts' &&
        call.body.data.typeSpecificData.slug === 'hello-world',
    )!
    expect(draft.body.data).toMatchObject({
      title: 'Hello',
      contentFormat: 'lexical',
      typeSpecificData: {
        slug: 'hello-world',
        sourceLang: 'en',
        authors: [expect.any(String), '1'],
        image: 'https://cdn.test/cover.png',
        seo: { description: 'Greeting' },
        createdAt: '2024-06-19T00:00:00.000Z',
      },
      meta: { bylineImport: { source: 'news/hello-world/index.mdx' } },
    })
    expect(JSON.parse(draft.body.data.content).root.children[1]).toMatchObject({
      type: 'banner',
      bannerType: 'tip',
    })
    const publish = calls.find((call) => call.path === '/publish-jobs')
    expect(publish?.body.aiResources).toEqual([])
    const translations = calls.filter((call) => call.method === 'PUT')
    expect(translations.map((call) => call.path).sort()).toEqual([
      expect.stringMatching(/\/ai\/translations\/article\/\d+\/fr$/),
      expect.stringMatching(/\/ai\/translations\/article\/\d+\/pt-BR$/),
      expect.stringMatching(/\/ai\/translations\/article\/\d+\/zh-CN$/),
    ])
    expect(
      translations.find((call) => call.path.endsWith('zh-CN'))?.body,
    ).toMatchObject({
      title: '你好',
      tags: ['介绍'],
      sourceLang: 'en',
      seo: {
        title: '你好 SEO',
        description: '问候',
        image: 'https://cdn.test/cover.png',
      },
    })
    expect(
      translations.find((call) => call.path.endsWith('pt-BR'))?.body.seo,
    ).toBeNull()

    calls.length = 0
    const second = await executeImport(plan, config, {
      root,
      client,
      dryRun: false,
    })
    expect(second.outcomes.map((o) => o.action)).toEqual([
      'unchanged',
      'unchanged',
      'skip',
    ])
    expect(calls.some((call) => call.method !== 'GET')).toBe(false)

    const forced = await executeImport(plan.slice(0, 1), config, {
      root,
      client,
      dryRun: false,
      force: true,
    })
    expect(forced.outcomes[0].action).toBe('update')
    const revise = calls.find((call) => call.path === '/drafts')
    expect(revise?.body).toMatchObject({ baseRevisionId: 'p1' })
  })
})
