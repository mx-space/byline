import { PanelRightOpen, Pencil, Trash2 } from 'lucide-react'

import type { DraftModel } from '~/models/draft'
import type { ListAction } from '~/ui/list-actions'

import type { DraftCopyFn } from '../copy'

export interface DraftActionHandlers {
  continueWriting: (draft: DraftModel) => void
  deleteMany: (drafts: DraftModel[]) => Promise<void> | void
  open: (draft: DraftModel) => void
}

export function buildDraftActions(
  handlers: DraftActionHandlers,
  copy: DraftCopyFn,
): ListAction<DraftModel>[] {
  return [
    {
      icon: PanelRightOpen,
      key: 'open',
      label: copy('openDetail'),
      run: (targets) => handlers.open(targets[0]),
      shortcut: 'Enter',
      shortcutLabel: '↵',
    },
    {
      icon: Pencil,
      key: 'continue',
      label: copy('continueWriting'),
      run: (targets) => handlers.continueWriting(targets[0]),
    },
    {
      danger: true,
      icon: Trash2,
      key: 'delete',
      label: copy('deleteDraft'),
      run: (targets) => handlers.deleteMany(targets),
      shortcut: 'Backspace',
      shortcutLabel: '⌫',
    },
  ]
}
