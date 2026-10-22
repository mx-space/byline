import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { AppErrorCode } from '~/common/errors'
import { transformResponseCase } from '~/common/response/case-transform'
import { users } from '~/database/schema'
import { DynamicComponentRepository } from '~/modules/dynamic-component/dynamic-component.repository'
import { RegisterDynamicComponentSchema } from '~/modules/dynamic-component/dynamic-component.schema'
import { DynamicComponentService } from '~/modules/dynamic-component/dynamic-component.service'
import { SnowflakeService } from '~/shared/id/snowflake.service'

const entry = (index: number, overrides: Record<string, unknown> = {}) =>
  RegisterDynamicComponentSchema.parse({
    name: `widget-${index}`,
    description: `Widget ${index}`,
    url: `https://cdn.example.test/objects/widget-${index}.js`,
    initialHeight: 200 + index,
    propsSchema: {
      type: 'object',
      properties: { maxItems: { type: 'number' } },
    },
    ...overrides,
  })

describe('dynamic component catalog (PostgreSQL)', () => {
  let context: PgTestDatabase
  let service: DynamicComponentService
  const apiCache = { invalidate: vi.fn(async () => {}) }

  beforeAll(async () => {
    context = await createPgTestDatabase('byline_dynamic_components')
    service = new DynamicComponentService(
      new DynamicComponentRepository(context.db as any, new SnowflakeService()),
      apiCache as any,
    )
    await context.db
      .insert(users)
      .values({ id: '1001', name: 'Ada', username: 'ada' })
  }, 120_000)

  afterAll(async () => {
    await context?.close()
  })

  it('starts as an empty version 1 catalog', async () => {
    await expect(service.getCatalog()).resolves.toEqual({
      version: 1,
      components: [],
    })
  })

  it('keeps every entry when writers register concurrently', async () => {
    const catalogs = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        service.register(entry(index), '1001'),
      ),
    )

    const catalog = await service.getCatalog()
    expect(catalog.components).toHaveLength(12)
    expect(new Set(catalog.components.map((item) => item.url)).size).toBe(12)
    for (const [index, returned] of catalogs.entries()) {
      expect(returned.components.map((item) => item.url)).toContain(
        entry(index).url,
      )
    }
  })

  it('updates an entry registered again under the same url instead of duplicating it', async () => {
    const before = await service.getCatalog()

    const after = await service.register(
      entry(3, {
        name: 'widget-3-renamed',
        initialHeight: 480,
        parentUrl: entry(0).url,
      }),
      '1001',
    )

    expect(after.components).toHaveLength(before.components.length)
    expect(after.components.map((item) => item.url)).toEqual(
      before.components.map((item) => item.url),
    )
    expect(after.components.find((item) => item.url === entry(3).url)).toEqual({
      name: 'widget-3-renamed',
      description: 'Widget 3',
      url: entry(3).url,
      initialHeight: 480,
      propsSchema: entry(3).propsSchema,
      parentUrl: entry(0).url,
    })
  })

  it('invalidates the public cache once a registration is stored', async () => {
    apiCache.invalidate.mockClear()

    await service.register(entry(50), '1001')

    expect(apiCache.invalidate).toHaveBeenCalledTimes(1)
  })

  it('rejects a new url that reuses another component name', async () => {
    apiCache.invalidate.mockClear()
    await expect(
      service.register(entry(99, { name: 'widget-1' }), '1001'),
    ).rejects.toMatchObject({
      code: AppErrorCode.DYNAMIC_COMPONENT_NAME_CONFLICT,
    })
    expect(apiCache.invalidate).not.toHaveBeenCalled()
  })

  it('serializes to the wire without rewriting propsSchema keys', async () => {
    const catalog = await service.getCatalog()
    const wire = transformResponseCase(catalog, [
      'components[].propsSchema',
    ]) as { components: Record<string, unknown>[] }

    const widget = wire.components.find((item) => item.url === entry(3).url)!
    expect(widget).toMatchObject({
      initial_height: 480,
      parent_url: entry(0).url,
      props_schema: {
        type: 'object',
        properties: { maxItems: { type: 'number' } },
      },
    })
    expect(wire.components[0]).not.toHaveProperty('parent_url')
  })
})
