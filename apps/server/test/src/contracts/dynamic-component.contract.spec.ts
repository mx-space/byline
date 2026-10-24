import { describe, expect, test, vi } from 'vitest'

import { apiRoutePrefix } from '~/common/decorators/api-controller.decorator'
import { DynamicComponentController } from '~/modules/dynamic-component/dynamic-component.controller'
import { DynamicComponentService } from '~/modules/dynamic-component/dynamic-component.service'

import { createE2EApp } from '../../helper/create-e2e-app'
import { authPassHeader, mockUser1 } from '../../mock/guard/auth.guard'

const propsSchema = {
  type: 'object',
  properties: { maxItems: { type: 'number', minValue: 1 } },
  additionalProperties: false,
}
const catalog = {
  version: 1,
  components: [
    {
      name: 'reading-list',
      description: 'Shows a reading list',
      url: 'https://cdn.example.test/objects/reading-list.js',
      initialHeight: 320,
      propsSchema,
      parentUrl: 'https://cdn.example.test/objects/list-base.js',
    },
  ],
}

const service = {
  getCatalog: vi.fn(async () => catalog),
  register: vi.fn(async () => catalog),
  update: vi.fn(async () => catalog),
  remove: vi.fn(async () => catalog),
}

describe('DynamicComponentController contract (e2e)', () => {
  const proxy = createE2EApp({
    controllers: [DynamicComponentController],
    providers: [{ provide: DynamicComponentService, useValue: service }],
  })

  test('GET /dynamic-components is public and keeps propsSchema keys verbatim', async () => {
    const res = await proxy.app.inject({
      method: 'GET',
      url: `${apiRoutePrefix}/dynamic-components`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      data: {
        version: 1,
        components: [
          {
            name: 'reading-list',
            description: 'Shows a reading list',
            url: 'https://cdn.example.test/objects/reading-list.js',
            initial_height: 320,
            props_schema: propsSchema,
            parent_url: 'https://cdn.example.test/objects/list-base.js',
          },
        ],
      },
    })
  })

  test('POST /dynamic-components requires a signed-in user', async () => {
    const res = await proxy.app.inject({
      method: 'POST',
      url: `${apiRoutePrefix}/dynamic-components`,
      payload: {
        name: 'x',
        url: 'https://cdn.example.test/objects/x.js',
        initialHeight: 100,
      },
    })

    expect(res.statusCode).toBe(401)
    expect(service.register).not.toHaveBeenCalled()
  })

  test('POST /dynamic-components accepts the admin entry shape and returns the catalog', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'POST',
      url: `${apiRoutePrefix}/dynamic-components`,
      payload: {
        name: 'reading-list',
        description: 'Shows a reading list',
        url: 'https://cdn.example.test/objects/reading-list.js',
        initialHeight: 320,
        propsSchema,
        parentUrl: 'https://cdn.example.test/objects/list-base.js',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(service.register).toHaveBeenCalledWith(
      {
        name: 'reading-list',
        description: 'Shows a reading list',
        url: 'https://cdn.example.test/objects/reading-list.js',
        initialHeight: 320,
        propsSchema,
        parentUrl: 'https://cdn.example.test/objects/list-base.js',
      },
      mockUser1.id,
    )
    expect(res.json().data.components[0].props_schema).toEqual(propsSchema)
  })

  test('POST /dynamic-components rejects an entry without a url', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'POST',
      url: `${apiRoutePrefix}/dynamic-components`,
      payload: { name: 'x', initialHeight: 100 },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json().error.code).toBe('VALIDATION_FAILED')
  })

  test.each(['javascript:alert(1)', 'data:text/javascript,alert(1)'])(
    'POST /dynamic-components rejects a non-http url (%s)',
    async (url) => {
      service.register.mockClear()
      const res = await proxy.app.inject({
        headers: authPassHeader,
        method: 'POST',
        url: `${apiRoutePrefix}/dynamic-components`,
        payload: { name: 'x', url, initialHeight: 100 },
      })

      expect(res.statusCode).toBe(422)
      expect(service.register).not.toHaveBeenCalled()
    },
  )

  test.each([
    ['PATCH', { name: 'x' }],
    ['DELETE', undefined],
  ] as const)(
    '%s /dynamic-components/:id requires a signed-in user',
    async (method, payload) => {
      const res = await proxy.app.inject({
        method,
        url: `${apiRoutePrefix}/dynamic-components/1234567890`,
        payload,
      })

      expect(res.statusCode).toBe(401)
      expect(service.update).not.toHaveBeenCalled()
      expect(service.remove).not.toHaveBeenCalled()
    },
  )

  test('PATCH /dynamic-components/:id passes a partial entry and keeps propsSchema keys', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'PATCH',
      url: `${apiRoutePrefix}/dynamic-components/1234567890`,
      payload: { initial_height: 200, props_schema: propsSchema },
    })

    expect(res.statusCode).toBe(200)
    expect(service.update).toHaveBeenCalledWith('1234567890', {
      initialHeight: 200,
      propsSchema,
    })
    expect(res.json().data.components[0].props_schema).toEqual(propsSchema)
  })

  test('DELETE /dynamic-components/:id removes the entry and returns the catalog', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'DELETE',
      url: `${apiRoutePrefix}/dynamic-components/1234567890`,
    })

    expect(res.statusCode).toBe(200)
    expect(service.remove).toHaveBeenCalledWith('1234567890')
    expect(res.json().data.version).toBe(1)
  })
})
