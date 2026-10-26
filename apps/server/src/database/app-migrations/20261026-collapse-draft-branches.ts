import { eq, sql } from 'drizzle-orm'

import { drafts } from '~/database/schema'
import { DraftRepository } from '~/modules/draft/draft.repository'
import { collapseBranches } from '~/modules/draft/draft-collapse'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import type { AppMigration } from './types'

export const migration: AppMigration = {
  id: '20261026-collapse-draft-branches',
  description:
    'Collapse every article to one draft working copy before Loro editing',
  async up({ db, logger }) {
    const repository = new DraftRepository(db, new SnowflakeService())
    const documents = await db
      .selectDistinct({ documentId: drafts.documentId })
      .from(drafts)
      .where(eq(drafts.status, 'active'))
      .orderBy(sql`${drafts.documentId}`)
    let archived = 0
    for (const { documentId } of documents) {
      const { retired } = await collapseBranches(repository, documentId)
      archived += retired.length
    }
    logger.log(
      `collapsed ${documents.length} documents, archived ${archived} draft branches`,
    )
  },
}
