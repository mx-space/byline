import { Inject, Injectable } from '@nestjs/common'
import { asc, sql } from 'drizzle-orm'

import { PG_DB_TOKEN } from '~/constants/system.constant'
import { dynamicComponents } from '~/database/schema'
import { BaseRepository } from '~/processors/database/base.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import type {
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
}
