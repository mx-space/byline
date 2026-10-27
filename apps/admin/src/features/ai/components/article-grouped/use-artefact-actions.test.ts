import { describe, expect, it, vi } from 'vitest'

import { resolveRetryInput } from './use-artefact-actions'

describe('resolveRetryInput', () => {
  it('forces one language without asking for an unlocked item', async () => {
    const confirm = vi.fn(async () => true)

    await expect(
      resolveRetryInput({ isLocked: false }, 'ja', 'post-1', confirm),
    ).resolves.toEqual({ force: true, langs: ['ja'], refId: 'post-1' })
    expect(confirm).not.toHaveBeenCalled()
  })

  it('overwrites a locked item only after the editor confirms', async () => {
    await expect(
      resolveRetryInput({ isLocked: true }, 'ja', 'post-1', async () => true),
    ).resolves.toEqual({
      force: true,
      langs: ['ja'],
      refId: 'post-1',
      regenerateLocked: true,
    })
  })

  it('does nothing when the editor declines to overwrite a locked item', async () => {
    await expect(
      resolveRetryInput({ isLocked: true }, 'ja', 'post-1', async () => false),
    ).resolves.toBeNull()
  })
})
