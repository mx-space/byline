import { ConfigProvider } from '@lobehub/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as motion from 'motion/react-m'
import { act, createElement } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getArchivedDrafts,
  getDraftHistory,
  getDraftShare,
  restoreDraftRevision,
  undoDraftChange,
} from '~/api/drafts'
import { I18nProvider } from '~/i18n'
import type { DraftHistory, DraftModel } from '~/models/draft'

import { TimelinePanel } from './TimelinePanel'

vi.mock('~/api/drafts', () => ({
  deleteDraftShare: vi.fn(),
  getArchivedDrafts: vi.fn(),
  getDraftHistory: vi.fn(),
  getDraftShare: vi.fn(),
  restoreDraftRevision: vi.fn(),
  setDraftShare: vi.fn(),
  undoDraftChange: vi.fn(),
}))
vi.mock('~/ui/feedback/confirm', () => ({
  confirmDialog: vi.fn(async () => true),
}))

const history: DraftHistory = {
  changes: [
    {
      deps: [{ counter: 3, peer: '1' }],
      id: { counter: 4, peer: '1' },
      lamport: 4,
      message: 'human:me',
      timestamp: 1_792_900_000,
    },
  ],
  checkpoints: [
    {
      contentFormat: 'lexical',
      createdAt: '2026-10-25T00:00:00.000Z',
      frontiers: [],
      id: 'rev-1',
      kind: 'save',
      parentRevisionId: null,
      title: 'Saved',
    },
  ],
}

let container: HTMLDivElement
let root: Root
const calls: string[] = []
const onBeforeChange = vi.fn(async () => {
  calls.push('flush')
})
const onChanged = vi.fn(async (change: { restored: boolean }) => {
  calls.push(change.restored ? 'reload-fields' : 'pull')
})

const render = async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          ConfigProvider,
          { motion } as never,
          createElement(
            I18nProvider,
            null,
            createElement(TimelinePanel, {
              authorName: (id: string) =>
                ({ ada: 'Ada', me: 'Me' })[id] ?? null,
              documentId: 'doc-1',
              draftId: 'd1',
              onBeforeChange,
              onChanged,
              publishedRevisionId: null,
              selfId: 'me',
            }),
          ),
        ),
      ),
    )
  })
  await act(async () => {
    await Promise.resolve()
  })
}

const click = async (label: string, index = 0) => {
  const button = await vi.waitFor(() => {
    const found = container.querySelectorAll<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    )[index]
    expect(found).toBeDefined()
    return found!
  })
  await act(async () => {
    button.click()
  })
  await vi.waitFor(() => expect(onChanged).toHaveBeenCalled())
}

beforeEach(() => {
  calls.length = 0
  onChanged.mockClear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  vi.mocked(getDraftHistory).mockResolvedValue(history)
  vi.mocked(getDraftShare).mockResolvedValue(null as never)
  vi.mocked(getArchivedDrafts).mockResolvedValue([])
  vi.mocked(restoreDraftRevision).mockImplementation(async (_id, revision) => {
    calls.push(`restore:${revision}`)
    return {} as never
  })
  vi.mocked(undoDraftChange).mockImplementation(async () => {
    calls.push('undo')
    return {} as never
  })
})

afterEach(() => {
  act(() => root.unmount())
  document.body.innerHTML = ''
})

describe('TimelinePanel', () => {
  it('sends unsent edits before restoring and reloads fields after', async () => {
    await render()

    await click('恢复到此版本')

    expect(calls).toEqual(['flush', 'restore:rev-1', 'reload-fields'])
  })

  it('sends unsent edits before undoing a step', async () => {
    await render()

    await click('撤销此步')

    expect(calls).toEqual(['flush', 'undo', 'pull'])
  })

  it('names steps by the member who made them', async () => {
    vi.mocked(getDraftHistory).mockResolvedValue({
      changes: [
        {
          deps: [],
          id: { counter: 9, peer: '3' },
          lamport: 9,
          message: 'human:ada',
          timestamp: 1_792_900_200,
        },
        {
          deps: [],
          id: { counter: 5, peer: '2' },
          lamport: 5,
          message: 'human:me',
          timestamp: 1_792_900_100,
        },
      ],
      checkpoints: [],
    })

    await render()

    await vi.waitFor(() =>
      expect(container.textContent).toContain('Ada 的编辑'),
    )
    expect(container.textContent).toContain('你的编辑')
  })

  it('restores an archived draft into the working copy', async () => {
    vi.mocked(getArchivedDrafts).mockResolvedValue([
      {
        headRevision: { title: 'Older work' },
        headRevisionId: 'old-head',
        id: 'archived-1',
        updatedAt: '2026-10-24T00:00:00.000Z',
      } as unknown as DraftModel,
    ])

    await render()
    await vi.waitFor(() =>
      expect(container.textContent).toContain('已归档的旧草稿（1）'),
    )

    await click('恢复到此版本', 1)

    expect(calls).toEqual(['flush', 'restore:old-head', 'reload-fields'])
  })
})
