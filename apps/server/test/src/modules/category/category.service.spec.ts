import { describe, expect, it, vi } from 'vitest'

import { CategoryService } from '~/modules/category/category.service'

describe('CategoryService deletion', () => {
  it.each([0, 1])(
    'only deletes a category when its article count is zero (count=%i)',
    async (count) => {
      const repository = {
        countAll: vi.fn().mockResolvedValue(1),
        findById: vi.fn().mockResolvedValue({ id: 'category-1' }),
        deleteById: vi.fn().mockResolvedValue(true),
      }
      const posts = { countByCategoryId: vi.fn().mockResolvedValue(count) }
      const service = new CategoryService(
        repository as any,
        { emit: vi.fn() } as any,
        {} as any,
        { get: () => posts } as any,
      )
      service.onApplicationBootstrap()
      if (count) {
        await expect(service.deleteById('category-1')).rejects.toThrow()
        expect(repository.deleteById).not.toHaveBeenCalled()
      } else {
        await expect(service.deleteById('category-1')).resolves.toEqual({
          deletedCount: 1,
        })
        expect(repository.deleteById).toHaveBeenCalledWith('category-1')
      }
      expect(posts.countByCategoryId).toHaveBeenCalledWith('category-1')
    },
  )
})

describe('CategoryService write events', () => {
  const setup = () => {
    let release!: () => void
    const emitted = new Promise<void>((resolve) => {
      release = resolve
    })
    const eventManager = { emit: vi.fn(() => emitted) }
    const repository = {
      create: vi.fn(async () => ({ id: 'category-1', name: 'News' })),
      update: vi.fn(async () => ({ id: 'category-1', name: 'News' })),
      findById: vi.fn(async () => ({ id: 'category-1', slug: 'news' })),
    }
    const service = new CategoryService(
      repository as any,
      eventManager as any,
      {} as any,
      { get: () => ({}) } as any,
    )
    service.onApplicationBootstrap()
    return { service, release }
  }

  it.each(['create', 'update'] as const)(
    'resolves %s only after the content event, and its cache invalidation, finished',
    async (action) => {
      const { service, release } = setup()
      let settled = false
      const pending = (
        action === 'create'
          ? service.create('News')
          : service.update('category-1', { name: 'News' })
      ).then(() => {
        settled = true
      })

      await new Promise((resolve) => setImmediate(resolve))
      expect(settled).toBe(false)
      release()
      await pending
      expect(settled).toBe(true)
    },
  )
})
