import { act, createElement } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DraftRecoveryReview } from './DraftRecoveryReview'
import { withUi } from './test-providers'

vi.mock('~/features/drafts/components/RichDraftDiffPanel', () => ({
  RichDraftDiffPanel: (props: {
    currentContent: string
    selectedContent: string
  }) => (
    <div data-testid="rich-recovery-diff">
      {props.selectedContent} → {props.currentContent}
    </div>
  ),
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  document.body.innerHTML = ''
})

describe('DraftRecoveryReview', () => {
  it('compares the article with the latest draft without loading it first', () => {
    const onContinue = vi.fn()
    const onDelete = vi.fn()

    act(() => {
      root.render(
        withUi(
          createElement(DraftRecoveryReview, {
            data: {
              bodyChanged: true,
              diverged: false,
              currentContent: 'current article body',
              draftContent: 'latest draft body',
              fields: [
                {
                  current: 'Current title',
                  draft: 'Draft title',
                  label: '标题',
                },
              ],
              savedAt: '刚刚',
            },
            onClose: vi.fn(),
            onContinue,
            onDelete,
            open: true,
          }),
        ),
      )
    })

    expect(document.body.textContent).toContain('Current title')
    expect(document.body.textContent).toContain('Draft title')
    expect(
      document.querySelector('[data-testid="rich-recovery-diff"]')?.textContent,
    ).toContain('current article body → latest draft body')
    expect(document.body.textContent).not.toMatch(/v\d+/)

    const buttons = [...document.querySelectorAll('button')]
    act(() => {
      buttons
        .find((button) => button.textContent?.includes('继续编辑草稿'))
        ?.click()
      buttons
        .find((button) => button.textContent?.includes('删除草稿'))
        ?.click()
    })

    expect(onContinue).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('shows separate ancestor-to-online and ancestor-to-draft diffs', () => {
    act(() => {
      root.render(
        withUi(
          createElement(DraftRecoveryReview, {
            data: {
              ancestorContent: 'shared ancestor',
              bodyChanged: true,
              currentContent: 'online change',
              diverged: true,
              draftContent: 'branch change',
              fields: [
                {
                  ancestor: 'Ancestor title',
                  current: 'Online title',
                  draft: 'Branch title',
                  label: '标题',
                },
              ],
              savedAt: '刚刚',
            },
            onClose: vi.fn(),
            onContinue: vi.fn(),
            onDelete: vi.fn(),
            open: true,
          }),
        ),
      )
    })

    const diffs = [
      ...document.querySelectorAll('[data-testid="rich-recovery-diff"]'),
    ].map((node) => node.textContent)
    expect(diffs).toEqual([
      'shared ancestor → online change',
      'shared ancestor → branch change',
    ])
    expect(document.body.textContent).toContain('Ancestor title')
  })
})
