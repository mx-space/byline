import type { ContextMenuItem } from '@lobehub/ui'

import type { ListAction } from '~/ui/list-actions'

export function buildFileMenuItems<T>(
  actions: ReadonlyArray<ListAction<T>>,
  target: T,
): ContextMenuItem[] {
  return actions
    .filter((action) => !action.available || action.available([target]))
    .map((action) => ({
      danger: action.danger,
      extra: action.shortcutLabel,
      icon: action.icon,
      key: action.key,
      label: action.label,
      onClick: () => void action.run([target]),
    }))
}
