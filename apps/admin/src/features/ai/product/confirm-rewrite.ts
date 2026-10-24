import type { Locale } from '~/i18n/types'
import { confirmDialog } from '~/ui/feedback/confirm'

import { aiCopy, type AiCopyKey } from '../copy'

export async function confirmTranslationRewrite(input: {
  locale: Locale
  lockedLangs: string[]
  targetLangs: string[] | undefined
}): Promise<
  | { cancelled: true; skippedLocked?: boolean }
  | { cancelled: false; langs: string[] | undefined; regenerateLocked: boolean }
> {
  const copy = (key: AiCopyKey, values?: Record<string, number | string>) =>
    aiCopy(input.locale, key, values)
  const locked = new Set(input.lockedLangs)
  const targets = input.targetLangs
  const lockedTargets = targets
    ? targets.filter((lang) => locked.has(lang))
    : input.lockedLangs

  const proceed = await confirmDialog({
    cancelText: copy('cancel'),
    confirmText: copy('replaceConfirm'),
    description: copy('replaceBody'),
    destructive: true,
    title: copy('replaceTitle'),
  })
  if (!proceed) return { cancelled: true }

  if (!lockedTargets.length) {
    return {
      cancelled: false,
      langs: targets,
      regenerateLocked: false,
    }
  }

  const overwrite = await confirmDialog({
    cancelText: copy('skipLocked'),
    confirmText: copy('overwriteLocked'),
    description: copy('overwriteBody', { langs: lockedTargets.join('、') }),
    destructive: true,
    title: copy('overwriteTitle'),
  })

  if (overwrite) {
    return { cancelled: false, langs: targets, regenerateLocked: true }
  }

  if (!targets) {
    return { cancelled: false, langs: undefined, regenerateLocked: false }
  }

  const remaining = targets.filter((lang) => !locked.has(lang))
  if (!remaining.length) return { cancelled: true, skippedLocked: true }
  return { cancelled: false, langs: remaining, regenerateLocked: false }
}
