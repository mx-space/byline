import { ExternalLink, Pencil, Trash2 } from 'lucide-react'

import type { PostModel } from '~/models/post'
import type { ListAction } from '~/ui/list-actions'

import type { PostCopy } from '../copy'

export interface PostActionHandlers {
  deleteMany: (posts: PostModel[]) => Promise<void> | void
  navigateToEdit: (post: PostModel) => void
  openExternal: (post: PostModel) => void
}

export function buildPostActions(
  handlers: PostActionHandlers,
  copy: PostCopy,
): ListAction<PostModel>[] {
  const typing = () => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return false
    if (active.isContentEditable) return true
    const tag = active.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
  }
  return [
    {
      available: () => !typing(),
      icon: Pencil,
      key: 'edit',
      label: copy('edit'),
      run: (targets) => handlers.navigateToEdit(targets[0]),
      shortcut: 'Enter',
      shortcutLabel: '↵',
    },
    {
      available: () => !typing(),
      icon: ExternalLink,
      key: 'open-external',
      label: copy('openLink'),
      run: (targets) => handlers.openExternal(targets[0]),
      shortcut: '$mod+Enter',
      shortcutLabel: '⌘↵',
    },
    {
      available: () => !typing(),
      danger: true,
      icon: Trash2,
      key: 'delete',
      label: copy('deletePost'),
      multi: true,
      run: (targets) => handlers.deleteMany(targets),
      shortcut: 'Backspace',
      shortcutLabel: '⌫',
    },
  ]
}
