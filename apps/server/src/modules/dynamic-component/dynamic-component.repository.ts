import { Inject, Injectable } from '@nestjs/common'
import { asc, eq, sql } from 'drizzle-orm'

import { PG_DB_TOKEN } from '~/constants/system.constant'
import { dynamicComponents } from '~/database/schema'
import { BaseRepository } from '~/processors/database/base.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import type {
  DynamicComponentPatch,
  DynamicComponentRow,
  DynamicComponentUpsertInput,
} from './dynamic-component.types'

const mapRow = (
  row: typeof dynamicComponents.$inferSelect,
): DynamicComponentRow => ({
  id: row.id,
  name: row.name,
  description: row.description,
  url: row.url,
  initialHeight: row.initialHeight,
  propsSchema: row.propsSchema ?? {},
  parentUrl: row.parentUrl,
  previousUrls: row.previousUrls ?? [],
  createdBy: row.createdBy,
  createdAt: row.createdAt,
})

@Injectable()
export class DynamicComponentRepository extends BaseRepository {
  constructor(
    @Inject(PG_DB_TOKEN) db: AppDatabase,
    private readonly snowflake: SnowflakeService,
  ) {
    super(db)
  }

  async listAll(): Promise<DynamicComponentRow[]> {
    const rows = await this.db
      .select()
      .from(dynamicComponents)
      .orderBy(asc(dynamicComponents.createdAt), asc(dynamicComponents.id))
    return rows.map(mapRow)
  }

  async upsertByUrl(
    input: DynamicComponentUpsertInput,
    createdBy: string | null,
  ): Promise<DynamicComponentRow> {
    const [row] = await this.db
      .insert(dynamicComponents)
      .values({
        id: this.snowflake.nextId(),
        ...input,
        createdBy,
      })
      .onConflictDoUpdate({
        target: dynamicComponents.url,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          initialHeight: sql`excluded.initial_height`,
          propsSchema: sql`excluded.props_schema`,
          parentUrl: sql`excluded.parent_url`,
        },
      })
      .returning()
    return mapRow(row)
  }

  async updateById(
    id: string,
    patch: DynamicComponentPatch,
  ): Promise<DynamicComponentRow | null> {
    if (Object.keys(patch).length === 0) {
      const [row] = await this.db
        .select()
        .from(dynamicComponents)
        .where(eq(dynamicComponents.id, id))
      return row ? mapRow(row) : null
    }
    const previousUrls =
      patch.url === undefined
        ? undefined
        : sql`CASE WHEN ${dynamicComponents.url} IS DISTINCT FROM ${patch.url}
            THEN array_remove(array_append(array_remove(${dynamicComponents.previousUrls}, ${dynamicComponents.url}), ${dynamicComponents.url}), ${patch.url}::text)
            ELSE ${dynamicComponents.previousUrls} END`
    const [row] = await this.db
      .update(dynamicComponents)
      .set(previousUrls ? { ...patch, previousUrls } : patch)
      .where(eq(dynamicComponents.id, id))
      .returning()
    return row ? mapRow(row) : null
  }

  async deleteById(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(dynamicComponents)
      .where(eq(dynamicComponents.id, id))
      .returning({ id: dynamicComponents.id })
    return rows.length > 0
  }
}
