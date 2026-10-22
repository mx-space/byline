import { describe, expect, test, vi } from 'vitest'

import { apiRoutePrefix } from '~/common/decorators/api-controller.decorator'
import { AuthorController } from '~/modules/user/author.controller'
import { UserService } from '~/modules/user/user.service'

import { createE2EApp } from '../../helper/create-e2e-app'

const author = {
  id: '101',
  displayName: 'Ada',
  avatar: null,
  bio: null,
  url: null,
  username: 'ada',
}

const userService = {
  listAuthors: vi.fn(async () => ({
    data: [author],
    pagination: {
      currentPage: 2,
      totalPage: 3,
      total: 21,
      size: 10,
      hasNextPage: true,
      hasPrevPage: true,
    },
  })),
  getAuthor: vi.fn(async () => author),
}

describe('AuthorController contract (e2e)', () => {
  const proxy = createE2EApp({
    controllers: [AuthorController],
    providers: [{ provide: UserService, useValue: userService }],
  })

  test('GET /authors is public and paginated', async () => {
    const res = await proxy.app.inject({
      method: 'GET',
      url: `${apiRoutePrefix}/authors?page=2&size=10`,
    })

    expect(res.statusCode).toBe(200)
    expect(userService.listAuthors).toHaveBeenCalledWith({ page: 2, size: 10 })
    expect(res.json()).toEqual({
      data: [
        {
          id: '101',
          display_name: 'Ada',
          avatar: null,
          bio: null,
          url: null,
          username: 'ada',
        },
      ],
      meta: {
        pagination: { page: 2, size: 10, total: 21, total_pages: 3 },
      },
    })
  })

  test('GET /authors/:idOrUsername is public', async () => {
    const res = await proxy.app.inject({
      method: 'GET',
      url: `${apiRoutePrefix}/authors/ada`,
    })

    expect(res.statusCode).toBe(200)
    expect(userService.getAuthor).toHaveBeenCalledWith('ada')
    expect(res.json().data.display_name).toBe('Ada')
  })

  test('GET /authors rejects an oversized page', async () => {
    const res = await proxy.app.inject({
      method: 'GET',
      url: `${apiRoutePrefix}/authors?size=500`,
    })

    expect(res.statusCode).toBe(422)
  })
})
