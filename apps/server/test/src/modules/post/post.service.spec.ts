import { describe, expect, it, vi } from 'vitest'

import { createPgRepositoryMock, now } from '@/helper/pg-repository-mock'
import { AppException } from '~/common/errors/exception.types'
import { ArticleTypeEnum } from '~/constants/article.constant'
import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import {
  CATEGORY_SERVICE_TOKEN,
  DRAFT_SERVICE_TOKEN,
} from '~/constants/injection.constant'
import { FileReferenceType } from '~/modules/file/file-reference.enum'
import type { PostRepository } from '~/modules/post/post.repository'
import { PostService } from '~/modules/post/post.service'
import type { PostRow } from '~/modules/post/post.types'
import { ContentFormat } from '~/shared/types/content-format.type'

const createPost = (overrides: Partial<PostRow> = {}): PostRow => ({
  id: 'post-1' as any,
  title: 'Post',
  slug: 'post',
  text: 'body',
  content: '{"root":{"children":[]}}',
  contentFormat: ContentFormat.Lexical,
  summary: null,
  images: [],
  meta: null,
  tags: [],
  categoryId: 'cat-1' as any,
  category: undefined,
  isPublished: true,
  sourceLang: null,
  image: null,
  seo: null,
  pinAt: null,
  pinOrder: null,
  authors: [],
  createdAt: now,
  modifiedAt: null,
  ...overrides,
})

const createService = () => {
  const repository = createPgRepositoryMock<PostRepository>()
  const categoryService = {
    findCategoryById: vi.fn().mockResolvedValue({
      id: 'cat-1',
      slug: 'default',
      name: 'Default',
    }),
    findBySlug: vi.fn().mockResolvedValue({
      id: 'cat-1',
      slug: 'default',
      name: 'Default',
    }),
  }
  const draftService = {
    deleteByRef: vi.fn(),
  }
  const moduleRef = {
    get: vi.fn((token) => {
      if (token === CATEGORY_SERVICE_TOKEN) return categoryService
      if (token === DRAFT_SERVICE_TOKEN) return draftService
      return null
    }),
  }
  const userRepository = {
    findByIds: vi.fn(async (ids: string[]) => ids.map((id) => ({ id }))),
  }
  const fileReferenceService = {
    activateReferences: vi.fn(),
    removeReferencesForDocument: vi.fn(),
    updateReferencesForDocument: vi.fn(),
  }
  const eventManager = { emit: vi.fn() }
  const slugTrackerService = {
    createTracker: vi.fn(),
    findTrackerBySlug: vi.fn(),
    deleteAllTracker: vi.fn(),
  }
  const lexicalService = { normalizeContentForStorage: vi.fn() }
  const apiCache = { invalidate: vi.fn() }
  const service = new PostService(
    repository as any,
    userRepository as any,
    fileReferenceService as any,
    eventManager as any,
    slugTrackerService as any,
    lexicalService as any,
    moduleRef as any,
    apiCache as any,
  )
  service.onApplicationBootstrap()

  return {
    apiCache,
    categoryService,
    draftService,
    eventManager,
    fileReferenceService,
    repository,
    service,
    slugTrackerService,
    userRepository,
  }
}

describe('PostService', () => {
  it('persists the public time on create and can change or clear it on update', async () => {
    const { repository, service } = createService()
    const publicAt = new Date('2999-01-01T12:00:00Z')
    repository.findBySlug.mockResolvedValue(null)
    repository.create.mockImplementation(async (input) =>
      createPost(input as Partial<PostRow>),
    )
    const created = await service.create({
      title: 'Scheduled',
      slug: 'scheduled',
      categoryId: 'cat-1',
      publicAt,
    } as any)
    expect(created.publicAt).toEqual(publicAt)

    repository.findById.mockResolvedValue(created)
    repository.update.mockImplementation(async (_id, patch) =>
      createPost(patch as Partial<PostRow>),
    )
    const changedTime = new Date('2999-02-01T12:00:00Z')
    const changed = await service.updateById(created.id, {
      publicAt: changedTime,
    })
    expect(changed?.publicAt).toEqual(changedTime)
    const cleared = await service.updateById(created.id, { publicAt: null })
    expect(cleared?.publicAt).toBeNull()
  })

  it('rejects Markdown content', async () => {
    const { repository, service } = createService()
    repository.findById.mockResolvedValue(createPost())

    await expect(
      service.updateById('post-1', {
        text: 'body',
        contentFormat: 'markdown' as any,
      }),
    ).rejects.toThrow(AppException)
    await expect(
      service.create({
        title: 'Post',
        text: 'body',
        categoryId: 'cat-1',
        contentFormat: 'markdown' as any,
      } as any),
    ).rejects.toThrow(AppException)
    expect(repository.update).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('defaults the byline to the creating user', async () => {
    const { repository, service } = createService()
    repository.findBySlug.mockResolvedValue(null)
    repository.create.mockResolvedValue(createPost())

    await service.create(
      { title: 'Solo', text: '', categoryId: 'cat-1' } as any,
      '1001',
    )

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorIds: ['1001'] }),
    )
  })

  it('keeps explicit authors in byline order, dropping duplicates', async () => {
    const { repository, service } = createService()
    repository.findBySlug.mockResolvedValue(null)
    repository.create.mockResolvedValue(createPost())

    await service.create(
      {
        title: 'Duo',
        text: '',
        categoryId: 'cat-1',
        authors: ['1003', { id: '1001' }, '1003'],
      } as any,
      '1002',
    )

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorIds: ['1003', '1001'] }),
    )
  })

  it('rejects authors that do not exist', async () => {
    const { repository, service, userRepository } = createService()
    repository.findById.mockResolvedValue(createPost())
    userRepository.findByIds.mockResolvedValue([{ id: '1001' }])

    await expect(
      service.updateById('post-1', { authors: ['1001', '1999'] } as any),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('replaces authors on update and leaves them alone when omitted', async () => {
    const { repository, service } = createService()
    repository.findById.mockResolvedValue(createPost())
    repository.update.mockResolvedValue(createPost())

    await service.updateById('post-1', { authors: ['1002', '1001'] } as any)
    await service.updateById('post-1', { tags: ['a'] } as any)

    expect(repository.update).toHaveBeenNthCalledWith(
      1,
      'post-1',
      expect.objectContaining({ authorIds: ['1002', '1001'] }),
    )
    expect(repository.update).toHaveBeenNthCalledWith(
      2,
      'post-1',
      expect.objectContaining({ authorIds: undefined }),
    )
  })

  it('stores source language, cover image and SEO fields', async () => {
    const { repository, service } = createService()
    repository.findBySlug.mockResolvedValue(null)
    repository.create.mockResolvedValue(createPost())

    await service.create(
      {
        title: 'Seo',
        text: '',
        categoryId: 'cat-1',
        sourceLang: 'zh-CN',
        image: 'https://cdn.example.com/cover.png',
        seo: { title: 'Seo title', description: '', extra: 'dropped' },
      } as any,
      '1001',
    )

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        image: 'https://cdn.example.com/cover.png',
        seo: { title: 'Seo title', description: null },
        sourceLang: 'zh-CN',
      }),
    )
  })

  it('creates posts through the PG repository after category and slug validation', async () => {
    const { repository, service } = createService()
    repository.findBySlug.mockResolvedValue(null)
    repository.create.mockResolvedValue(createPost())

    const result = await service.create({
      title: 'Hello World',
      text: 'body',
      categoryId: 'cat-1',
    } as any)

    expect(result.slug).toBe('post')
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hello World',
        slug: 'Hello-World',
        categoryId: 'cat-1',
        contentFormat: ContentFormat.Lexical,
      }),
    )
  })

  it('rejects duplicate slugs before creating the PG row', async () => {
    const { repository, service } = createService()
    repository.findBySlug.mockResolvedValue(createPost())

    await expect(
      service.create({
        title: 'Post',
        text: 'body',
        categoryId: 'cat-1',
      } as any),
    ).rejects.toThrow(AppException)

    expect(repository.create).not.toHaveBeenCalled()
  })

  it('tracks old public paths when slug changes', async () => {
    const { repository, service, slugTrackerService } = createService()
    repository.findById.mockResolvedValue(createPost({ slug: 'old-post' }))
    repository.findBySlug.mockResolvedValue(null)
    repository.update.mockResolvedValue(createPost({ slug: 'new-post' }))

    await service.updateById('post-1', { slug: 'new post' } as any)

    expect(slugTrackerService.createTracker).toHaveBeenCalledWith(
      '/default/old-post',
      ArticleTypeEnum.Post,
      'post-1',
    )
    expect(repository.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ slug: 'new-post' }),
    )
  })

  it('cleans drafts, slug trackers and references when deleting a post', async () => {
    const {
      draftService,
      eventManager,
      fileReferenceService,
      repository,
      service,
      slugTrackerService,
    } = createService()
    repository.findById.mockResolvedValue(createPost())
    repository.deleteById.mockResolvedValue(createPost())

    await service.deletePost('post-1')

    expect(repository.deleteById).toHaveBeenCalledWith('post-1')
    expect(draftService.deleteByRef).toHaveBeenCalled()
    expect(slugTrackerService.deleteAllTracker).toHaveBeenCalledWith('post-1')
    expect(
      fileReferenceService.removeReferencesForDocument,
    ).toHaveBeenCalledWith('post-1', FileReferenceType.Post)
    expect(eventManager.emit).toHaveBeenCalledWith(
      BusinessEvents.POST_DELETE,
      { id: 'post-1' },
      {
        scope: EventScope.TO_SYSTEM_VISITOR,
        nextTick: true,
      },
    )
  })

  it('does not invalidate aggregate caches when post deletion fails', async () => {
    const { eventManager, repository, service } = createService()
    repository.findById.mockResolvedValue(createPost())
    repository.deleteById.mockRejectedValue(new Error('delete failed'))

    await expect(service.deletePost('post-1')).rejects.toThrow('delete failed')

    expect(eventManager.emit).not.toHaveBeenCalled()
  })

  it('emits POST_REPUBLISH when a post returns online', async () => {
    vi.useFakeTimers()
    const { eventManager, repository, service } = createService()
    repository.findById.mockResolvedValue(createPost({ isPublished: true }))

    service.afterUpdatePost('post-1', false)
    await vi.advanceTimersByTimeAsync(1100)
    vi.useRealTimers()

    expect(eventManager.emit).toHaveBeenCalledWith(
      BusinessEvents.POST_REPUBLISH,
      { id: 'post-1' },
      { scope: EventScope.TO_SYSTEM_VISITOR },
    )
  })

  it('emits POST_UNPUBLISH without permanent-delete semantics', async () => {
    vi.useFakeTimers()
    const { eventManager, repository, service } = createService()
    repository.findById.mockResolvedValue(createPost({ isPublished: false }))

    service.afterUpdatePost('post-1', true)
    await vi.advanceTimersByTimeAsync(1100)
    vi.useRealTimers()

    expect(eventManager.emit).toHaveBeenCalledWith(
      BusinessEvents.POST_UNPUBLISH,
      { id: 'post-1' },
      { scope: EventScope.TO_SYSTEM_VISITOR },
    )
  })

  it('keeps draft-only updates off the visitor scope', async () => {
    vi.useFakeTimers()
    const { eventManager, repository, service } = createService()
    repository.findById.mockResolvedValue(createPost({ isPublished: false }))

    service.afterUpdatePost('post-1', false)
    await vi.advanceTimersByTimeAsync(1100)
    vi.useRealTimers()

    expect(eventManager.emit).toHaveBeenCalledWith(
      BusinessEvents.POST_UPDATE,
      { id: 'post-1' },
      { scope: EventScope.TO_SYSTEM },
    )
  })
})

describe('PostService public cache invalidation', () => {
  it('invalidates right after an update is written, ahead of the debounced event', async () => {
    const { apiCache, eventManager, repository, service } = createService()
    repository.findById.mockResolvedValue(createPost())
    repository.update.mockResolvedValue(createPost({ title: 'New' }))

    await service.updateById('post-1', { title: 'New' } as any)

    expect(apiCache.invalidate).toHaveBeenCalledTimes(1)
    expect(apiCache.invalidate.mock.invocationCallOrder[0]).toBeGreaterThan(
      repository.update.mock.invocationCallOrder[0],
    )
    expect(eventManager.emit).not.toHaveBeenCalled()
  })

  it('invalidates after a post is created', async () => {
    const { apiCache, repository, service } = createService()
    repository.findBySlug.mockResolvedValue(null)
    repository.create.mockResolvedValue(createPost())

    await service.create(
      { title: 'Fresh', text: '', categoryId: 'cat-1' } as any,
      '1001',
    )

    expect(apiCache.invalidate).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate when the write is rejected', async () => {
    const { apiCache, repository, service } = createService()
    repository.findBySlug.mockResolvedValue(createPost())

    await expect(
      service.create({ title: 'Post', text: '', categoryId: 'cat-1' } as any),
    ).rejects.toThrow(AppException)

    expect(apiCache.invalidate).not.toHaveBeenCalled()
  })
})
