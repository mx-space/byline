import { Injectable } from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'

import { DynamicComponentRepository } from './dynamic-component.repository'
import {
  DYNAMIC_CATALOG_VERSION,
  type RegisterDynamicComponentDto,
} from './dynamic-component.schema'
import type { DynamicComponentRow } from './dynamic-component.types'
import { DynamicComponentViews } from './dynamic-component.views'

const NAME_UNIQUE_CONSTRAINT = 'dynamic_components_name_uniq'

const isNameConflict = (error: unknown): boolean => {
  for (
    let current: unknown = error;
    current && typeof current === 'object';
    current = (current as { cause?: unknown }).cause
  ) {
    const { code, constraint } = current as {
      code?: unknown
      constraint?: unknown
    }
    if (code === '23505' && constraint === NAME_UNIQUE_CONSTRAINT) return true
  }
  return false
}

@Injectable()
export class DynamicComponentService {
  constructor(private readonly repository: DynamicComponentRepository) {}

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
      if (isNameConflict(error)) {
        throw createAppException(AppErrorCode.DYNAMIC_COMPONENT_NAME_CONFLICT, {
          name: dto.name,
        })
      }
      throw error
    }
    return this.getCatalog()
  }
}
