import type { ContextMenuItem as LobeMenuItem } from '@lobehub/ui'

import type { ContextMenuItem } from '~/ui/overlay/context-menu'

export function toLobeMenuItems(items: ContextMenuItem[]): LobeMenuItem[] {
  const next: LobeMenuItem[] = []
  items.forEach((item, index) => {
    if (!item) return
    const key = item.key ?? `item-${index}`
    if (item.type === 'divider') {
      next.push({ key, type: 'divider' })
      return
    }
    if (item.type === 'checkbox' || item.type === 'group' || 'children' in item)
      return
    const click = item.onClick
    next.push({
      danger: item.danger,
      disabled: item.disabled,
      icon: item.icon,
      key,
      label: item.label,
      onClick: click ? () => click(undefined as never) : undefined,
    })
  })
  return next
}
