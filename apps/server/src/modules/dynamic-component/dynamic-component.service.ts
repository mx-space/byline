import { Injectable } from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'
import { ApiCacheService } from '~/processors/redis/api-cache.service'

import { DynamicComponentRepository } from './dynamic-component.repository'
import {
  DYNAMIC_CATALOG_VERSION,
  type RegisterDynamicComponentDto,
  type UpdateDynamicComponentDto,
} from './dynamic-component.schema'
import type { DynamicComponentRow } from './dynamic-component.types'
import { DynamicComponentViews } from './dynamic-component.views'

const NAME_UNIQUE_CONSTRAINT = 'dynamic_components_name_uniq'
const URL_UNIQUE_CONSTRAINT = 'dynamic_components_url_uniq'

const findUniqueViolation = (error: unknown): string | null => {
  for (
    let current: unknown = error;
    current && typeof current === 'object';
    current = (current as { cause?: unknown }).cause
  ) {
    const { code, constraint } = current as {
      code?: unknown
      constraint?: unknown
    }
    if (code === '23505' && typeof constraint === 'string') return constraint
  }
  return null
}

@Injectable()
export class DynamicComponentService {
  constructor(
    private readonly repository: DynamicComponentRepository,
    private readonly apiCache: ApiCacheService,
  ) {}

  private toCatalog(rows: DynamicComponentRow[]) {
    return DynamicComponentViews.catalog.parse({
      version: DYNAMIC_CATALOG_VERSION,
      components: rows.map(({ parentUrl, ...row }) => ({
        ...row,
        ...(parentUrl ? { parentUrl } : {}),
      })),
    })
  }

  async getCatalog() {
    return this.toCatalog(await this.repository.listAll())
  }

  async register(dto: RegisterDynamicComponentDto, actorId: string | null) {
    try {
      await this.repository.upsertByUrl(
        {
          name: dto.name,
          description: dto.description,
          url: dto.url,
          initialHeight: dto.initialHeight,
          propsSchema: dto.propsSchema,
          parentUrl: dto.parentUrl ?? null,
        },
        actorId,
      )
    } catch (error) {
      this.rethrowConflict(error, dto)
    }
    await this.apiCache.invalidate()
    return this.getCatalog()
  }

  async update(id: string, dto: UpdateDynamicComponentDto) {
    let row: DynamicComponentRow | null
    try {
      row = await this.repository.updateById(id, dto)
    } catch (error) {
      this.rethrowConflict(error, dto)
    }
    if (!row) {
      throw createAppException(AppErrorCode.DYNAMIC_COMPONENT_NOT_FOUND, { id })
    }
    await this.apiCache.invalidate()
    return this.getCatalog()
  }

  async remove(id: string) {
    if (!(await this.repository.deleteById(id))) {
      throw createAppException(AppErrorCode.DYNAMIC_COMPONENT_NOT_FOUND, { id })
    }
    await this.apiCache.invalidate()
    return this.getCatalog()
  }

  private rethrowConflict(
    error: unknown,
    dto: { name?: string; url?: string },
  ): never {
    const constraint = findUniqueViolation(error)
    if (constraint === NAME_UNIQUE_CONSTRAINT) {
      throw createAppException(AppErrorCode.DYNAMIC_COMPONENT_NAME_CONFLICT, {
        name: dto.name ?? '',
      })
    }
    if (constraint === URL_UNIQUE_CONSTRAINT) {
      throw createAppException(AppErrorCode.DYNAMIC_COMPONENT_URL_CONFLICT, {
        url: dto.url ?? '',
      })
    }
    throw error
  }
}
