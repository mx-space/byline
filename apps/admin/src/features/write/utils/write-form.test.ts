import { describe, expect, it } from 'vitest'

import { diffDraftFields } from '~/features/write/crdt/draft-fields'
import type { DraftFields, RevisionSnapshot } from '~/models/draft'

import {
  emptyState,
  fieldsOf,
  formFieldsOf,
  fromRevision,
  toDraftData,
} from './write-form'

const imported = {
  content: '',
  contentFormat: 'lexical',
  images: null,
  meta: null,
  text: '',
  title: 'Imported',
  typeSpecificData: {
    authors: ['u1'],
    categoryId: 'c',
    createdAt: '2025-01-28T00:00:00.000Z',
    slug: 's',
    summary: '',
    tags: ['a'],
  },
} as unknown as RevisionSnapshot

const opened = { ...emptyState, publishedAt: '2025-01-28T00:00:00.000Z' }

describe('formFieldsOf', () => {
  it('sends no field patch for an article opened without edits', () => {
    const state = fromRevision('post', imported, opened)

    expect(
      diffDraftFields(
        formFieldsOf('post', imported, opened),
        fieldsOf(toDraftData('post', state)),
      ),
    ).toBeNull()
  })

  it('differs from the stored fields the form cannot round-trip', () => {
    const state = fromRevision('post', imported, opened)
    const stored: DraftFields = {
      meta: null,
      typeSpecificData:
        imported.typeSpecificData as DraftFields['typeSpecificData'],
    }

    expect(
      diffDraftFields(stored, fieldsOf(toDraftData('post', state))),
    ).not.toBeNull()
  })

  it('still sees a field the user changes after opening', () => {
    const state = { ...fromRevision('post', imported, opened), pin: true }

    expect(
      diffDraftFields(
        formFieldsOf('post', imported, opened),
        fieldsOf(toDraftData('post', state)),
      ),
    ).toMatchObject({ typeSpecificData: { pin: true } })
  })
})
