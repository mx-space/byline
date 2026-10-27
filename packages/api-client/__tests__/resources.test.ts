import { describe, expect, it } from 'vitest'

import { createClient, toDraftData } from '../src'
import { mockFetch, type RecordedCall } from './helpers'

const draftRow = (overrides: Record<string, unknown> = {}) => ({
  id: '10',
  head_revision_id: '11',
  relation: 'fresh',
  document: { id: '12', ref_id: null, published_revision_id: null },
  ...overrides,
})

const route = (call: RecordedCall) => `${call.method} ${call.url.pathname}`

describe('posts', () => {
  it('lists with ?lang, author filter and keeps meta verbatim', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: {
        data: [
          {
            id: '1',
            source_lang: 'zh-TW',
            authors: [{ id: '2', display_name: 'Ada' }],
            meta: { custom_key: 1 },
          },
        ],
        meta: {
          pagination: { page: 1, size: 10, total: 1, total_pages: 1 },
          translation: { '1': { article: { is_translated: true } } },
        },
      },
    }))
    const client = createClient({ endpoint: 'http://x', lang: 'zh-TW', fetch })
    const { data, meta } = await client.posts.list({
      authorId: '2',
      categoryIds: ['3', '4'],
    })
    expect(calls[0].url.searchParams.get('lang')).toBe('zh-TW')
    expect(calls[0].url.searchParams.get('authorId')).toBe('2')
    expect(calls[0].url.searchParams.get('categoryIds')).toBe('3,4')
    expect(data[0]).toMatchObject({
      sourceLang: 'zh-TW',
      authors: [{ displayName: 'Ada' }],
      meta: { custom_key: 1 },
    })
    expect(meta?.translation).toEqual({
      '1': { article: { isTranslated: true } },
    })
  })

  it('getBySlugOnly reads the detail by slug in one request', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: {
        data: { id: '7', slug: 'hello world', meta: { custom_key: 1 } },
        meta: { translation: { '7': { article: { is_translated: true } } } },
      },
    }))
    const client = createClient({ endpoint: 'http://x', lang: 'ja', fetch })
    const { data, meta } = await client.posts.getBySlugOnly('hello world')
    expect(calls.map(route)).toEqual(['GET /posts/slug/hello%20world'])
    expect(calls[0].url.searchParams.get('lang')).toBe('ja')
    expect(data).toMatchObject({ id: '7', meta: { custom_key: 1 } })
    expect(meta?.translation).toEqual({
      '7': { article: { isTranslated: true } },
    })
  })

  it('findBySlug resolves the category path and returns null on 404', async () => {
    const { fetch, calls } = mockFetch((call) => {
      if (call.url.pathname === '/posts/get-url/known')
        return { body: { data: { path: '/news/known' } } }
      if (call.url.pathname === '/posts/news/known')
        return { body: { data: { id: '7', slug: 'known' } } }
      return {
        status: 404,
        body: { error: { code: 'POST_NOT_FOUND', message: 'nope' } },
      }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    await expect(client.posts.findBySlug('known')).resolves.toMatchObject({
      data: { id: '7' },
    })
    await expect(client.posts.findBySlug('missing')).resolves.toBeNull()
    expect(calls.map(route)).toContain('GET /posts/news/known')
  })

  it('creates through a draft and waits for the publish job', async () => {
    let polls = 0
    const { fetch, calls } = mockFetch((call) => {
      switch (route(call)) {
        case 'POST /drafts': {
          return { body: { data: draftRow() } }
        }
        case 'POST /publish-jobs': {
          return { body: { data: { task_id: 't1', created: true } } }
        }
        case 'GET /tasks/t1': {
          polls++
          return {
            body: {
              data:
                polls < 2
                  ? { id: 't1', status: 'running' }
                  : {
                      id: 't1',
                      status: 'completed',
                      result: { article_id: '99' },
                    },
            },
          }
        }
        default: {
          return { status: 500, body: {} }
        }
      }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    const result = await client.posts.create(
      {
        title: 'Hello',
        content: { root: { type: 'root', children: [] } },
        text: 'Hello',
        slug: 'hello',
        categoryId: '5',
        authors: ['2', '3'],
        sourceLang: 'en',
        seo: { description: 'd' },
      },
      { aiResources: [], intervalMs: 1 },
    )

    expect(result).toEqual({
      draft: expect.objectContaining({ id: '10' }),
      postId: '99',
      taskId: 't1',
    })
    expect(calls[0].body).toEqual({
      refType: 'post',
      data: {
        contentFormat: 'lexical',
        title: 'Hello',
        text: 'Hello',
        content: JSON.stringify({ root: { type: 'root', children: [] } }),
        typeSpecificData: {
          slug: 'hello',
          categoryId: '5',
          authors: ['2', '3'],
          sourceLang: 'en',
          seo: { description: 'd' },
        },
      },
    })
    expect(calls[1].body).toEqual({
      branchId: '10',
      revisionId: '11',
      expectedPublishedRevisionId: null,
      aiResources: [],
    })
  })

  it('revises from the published revision', async () => {
    const { fetch, calls } = mockFetch((call) => {
      switch (route(call)) {
        case 'GET /drafts/context/post/7': {
          return {
            body: {
              data: {
                published_revision: {
                  id: '50',
                  title: 'Old',
                  text: 'old',
                  content: '{"root":{}}',
                  images: null,
                  meta: null,
                  type_specific_data: { slug: 'a', category_id: '5' },
                },
              },
            },
          }
        }
        case 'POST /drafts': {
          return {
            body: {
              data: draftRow({
                relation: 'in_sync',
                document: {
                  id: '12',
                  ref_id: '7',
                  published_revision_id: '50',
                },
              }),
            },
          }
        }
        case 'POST /publish-jobs': {
          return { body: { data: { task_id: 't2', created: true } } }
        }
        default: {
          return {
            body: {
              data: {
                id: 't2',
                status: 'completed',
                result: { article_id: '7' },
              },
            },
          }
        }
      }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    await client.posts.revise('7', { title: 'New', authors: ['9'] })
    expect(calls[1].body).toMatchObject({
      refId: '7',
      baseRevisionId: '50',
      ifInSync: true,
      data: {
        title: 'New',
        text: 'old',
        content: '{"root":{}}',
        typeSpecificData: { slug: 'a', categoryId: '5', authors: ['9'] },
      },
    })
    expect(calls[2].body).toMatchObject({
      expectedPublishedRevisionId: '50',
    })
    expect(calls[2].body).not.toHaveProperty('confirmDiverged')
  })

  it('writes into a working copy that is ahead when it does not publish', async () => {
    const { fetch, calls } = mockFetch((call) => {
      if (route(call) === 'GET /drafts/context/post/7') {
        return {
          body: {
            data: {
              published_revision: {
                id: '50',
                title: 'Old',
                text: 'old',
                content: '{"root":{}}',
                type_specific_data: {},
              },
            },
          },
        }
      }
      return { body: { data: draftRow({ relation: 'ahead' }) } }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    await client.posts.revise('7', { title: 'New' }, { publish: false })
    expect(calls).toHaveLength(2)
    expect(calls[1].body).not.toHaveProperty('ifInSync')
  })

  it('surfaces a failed publish task', async () => {
    const { fetch } = mockFetch((call) => {
      if (route(call) === 'POST /drafts') return { body: { data: draftRow() } }
      if (route(call) === 'POST /publish-jobs')
        return { body: { data: { task_id: 't3', created: true } } }
      return {
        body: { data: { id: 't3', status: 'failed', error: 'USER_NOT_FOUND' } },
      }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    await expect(
      client.posts.create({ title: 'x', content: '{"root":{}}' }),
    ).rejects.toMatchObject({ code: 'PUBLISH_FAILED' })
  })
})

describe('toDraftData', () => {
  it('splits core fields from type specific data', () => {
    expect(toDraftData({ title: 't', pin: true })).toEqual({
      contentFormat: 'lexical',
      title: 't',
      typeSpecificData: { pin: true },
    })
  })
})

describe('summaries', () => {
  it('writes a locked manual summary for one language', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: {
        data: {
          id: '1',
          ref_id: '7',
          lang: 'pt-BR',
          summary: 'Olá',
          is_locked: true,
        },
      },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.summaries.writeManual('7', 'pt-BR', {
      summary: 'Olá',
    })
    expect(route(calls[0])).toBe('PUT /ai/summaries/article/7/lang/pt-BR')
    expect(calls[0].body).toEqual({ summary: 'Olá' })
    expect(data.isLocked).toBe(true)
  })
})

describe('translations, catalog and files', () => {
  it('writes a manual translation with a serialized Lexical state', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: { data: { id: '1', lang: 'pt-BR', is_locked: true } },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.translations.writeManual('7', 'pt-BR', {
      title: 'Olá',
      content: { root: { type: 'root', children: [] } },
      tags: ['a'],
    })
    expect(route(calls[0])).toBe('PUT /ai/translations/article/7/pt-BR')
    expect(calls[0].body).toMatchObject({
      title: 'Olá',
      content: '{"root":{"type":"root","children":[]}}',
    })
    expect(data.isLocked).toBe(true)
  })

  it('keeps props_schema keys as sent in the dynamic component catalog', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: {
        data: {
          version: 1,
          components: [
            {
              name: 'Chart',
              initial_height: 300,
              props_schema: { data_url: { type: 'string' } },
            },
          ],
        },
      },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.dynamicComponents.register({
      name: 'Chart',
      url: 'https://cdn.test/chart.js',
      initialHeight: 300,
      propsSchema: { data_url: { type: 'string' } },
    })
    expect(calls[0].body).toMatchObject({
      propsSchema: { data_url: { type: 'string' } },
    })
    expect(data.components[0]).toEqual({
      name: 'Chart',
      initialHeight: 300,
      propsSchema: { data_url: { type: 'string' } },
    })
  })

  it('updates and removes a dynamic component by id', async () => {
    const catalog = {
      version: 1,
      components: [
        {
          id: '7',
          name: 'Chart',
          url: 'https://cdn.test/chart-2.js',
          parent_url: 'https://cdn.test/chart-1.js',
          previous_urls: ['https://cdn.test/chart-1.js'],
          initial_height: 300,
          props_schema: { data_url: { type: 'string' } },
        },
      ],
    }
    const { fetch, calls } = mockFetch(() => ({ body: { data: catalog } }))
    const client = createClient({ endpoint: 'http://x', fetch })

    const { data } = await client.dynamicComponents.update('7', {
      url: 'https://cdn.test/chart-2.js',
      parentUrl: 'https://cdn.test/chart-1.js',
      propsSchema: { data_url: { type: 'string' } },
    })
    await client.dynamicComponents.remove('7')

    expect(calls[0].method).toBe('PATCH')
    expect(calls[0].url.pathname).toBe('/dynamic-components/7')
    expect(calls[0].body).toMatchObject({
      propsSchema: { data_url: { type: 'string' } },
    })
    expect(data.components[0]).toMatchObject({
      id: '7',
      previousUrls: ['https://cdn.test/chart-1.js'],
      propsSchema: { data_url: { type: 'string' } },
    })
    expect(calls[1].method).toBe('DELETE')
    expect(calls[1].url.pathname).toBe('/dynamic-components/7')
  })

  it('uploads files as multipart form data', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: { data: { url: 'http://x/objects/image/a.png', name: 'a.png' } },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.files.upload(new Blob(['png']), {
      type: 'image',
      filename: 'a.png',
    })
    expect(calls[0].url.searchParams.get('type')).toBe('image')
    expect(calls[0].body).toBeInstanceOf(FormData)
    expect(calls[0].headers['content-type']).toBeUndefined()
    expect(data.name).toBe('a.png')
  })

  it('pages through every user', async () => {
    const { fetch, calls } = mockFetch((call) => {
      const page = Number(call.url.searchParams.get('page'))
      return {
        body: {
          data: [{ id: String(page) }],
          meta: {
            pagination: { page, size: 100, total: 2, total_pages: 2 },
          },
        },
      }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    const users = await client.users.listAll({ status: 'all' })
    expect(users.map((user) => user.id)).toEqual(['1', '2'])
    expect(calls).toHaveLength(2)
  })
})

describe('authors and invites', () => {
  it('lists public authors with pagination and pages through all', async () => {
    const { fetch, calls } = mockFetch((call) => {
      const page = Number(call.url.searchParams.get('page'))
      return {
        body: {
          data: [
            { id: String(page), display_name: `A${page}`, username: null },
          ],
          meta: {
            pagination: { page, size: 100, total: 2, total_pages: 2 },
          },
        },
      }
    })
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data, meta } = await client.authors.list({ page: 1, size: 20 })
    expect(route(calls[0])).toBe('GET /authors')
    expect(calls[0].url.searchParams.get('size')).toBe('20')
    expect(data[0]).toEqual({ id: '1', displayName: 'A1', username: null })
    expect(meta?.pagination.totalPages).toBe(2)

    const all = await client.authors.listAll()
    expect(all.map((author) => author.id)).toEqual(['1', '2'])
  })

  it('gets an author by id or username', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: { data: { id: '3', display_name: 'Ada', username: 'ada' } },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.authors.get('Ada Lovelace')
    expect(calls[0].url.pathname).toBe('/authors/Ada%20Lovelace')
    expect(data.username).toBe('ada')
  })

  it('invites a profile-only user by id', async () => {
    const { fetch, calls } = mockFetch(() => ({
      status: 201,
      body: {
        data: {
          id: '8',
          email: 'ada@example.com',
          user_id: '3',
          accept_url: 'http://x/accept',
          email_queued: false,
        },
      },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.users.invite('3', { displayName: 'Ada' })
    expect(route(calls[0])).toBe('POST /users/3/invite')
    expect(calls[0].body).toEqual({ displayName: 'Ada' })
    expect(data).toMatchObject({ userId: '3', acceptUrl: 'http://x/accept' })

    await client.users.invite('3')
    expect(calls[1].body).toEqual({})
  })

  it('sends and reads translation seo', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: {
        data: { id: '1', lang: 'de', seo: { title: 'T', image: null } },
      },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const { data } = await client.translations.writeManual('7', 'de', {
      title: 'Hallo',
      content: '{"root":{}}',
      seo: { title: 'T', description: 'D' },
    })
    expect(calls[0].body).toMatchObject({
      seo: { title: 'T', description: 'D' },
    })
    expect(data.seo).toEqual({ title: 'T', image: null })

    await client.translations.update('1', { seo: null })
    expect(route(calls[1])).toBe('PATCH /ai/translations/1')
    expect(calls[1].body).toEqual({ seo: null })
  })

  it('creates a publish job without an expected published revision', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: { data: { task_id: 't', created: true } },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    await client.publishJobs.create({ branchId: '1', revisionId: '2' })
    expect(calls[0].body).toEqual({ branchId: '1', revisionId: '2' })
  })
})
