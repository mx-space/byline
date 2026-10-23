import {
  closeContextMenu as closeLobeContextMenu,
  type ContextMenuItem as LobeContextMenuItem,
  showContextMenu as showLobeContextMenu,
  updateContextMenuItems as updateLobeContextMenuItems,
} from '@lobehub/ui'

import type {
  ContextMenuCheckboxItemType,
  ContextMenuItem,
  ContextMenuItemType,
  ContextMenuSubmenuType,
} from '../types'

function toLobeItem(item: ContextMenuItem, index: number): LobeContextMenuItem {
  if (!item) return null
  const key = item.key ?? `${item.type ?? 'item'}-${index}`
  if (item.type === 'divider') {
    return { dashed: item.dashed, key, type: 'divider' }
  }
  if (item.type === 'group') {
    return {
      children: item.children?.map(toLobeItem),
      key,
      label: item.label,
      type: 'group',
    }
  }
  if (item.type === 'checkbox') {
    const checkbox = item as ContextMenuCheckboxItemType
    return {
      checked: checkbox.checked,
      closeOnClick: checkbox.closeOnClick,
      danger: checkbox.danger,
      defaultChecked: checkbox.defaultChecked,
      desc: checkbox.desc,
      disabled: checkbox.disabled,
      extra: checkbox.extra,
      icon: checkbox.icon,
      key,
      label: checkbox.label,
      onCheckedChange: checkbox.onCheckedChange,
      title: checkbox.title,
      type: 'checkbox',
    }
  }
  if (item.type === 'submenu' || 'children' in item) {
    const submenu = item as ContextMenuSubmenuType
    return {
      children: submenu.children.map(toLobeItem),
      danger: submenu.danger,
      desc: submenu.desc,
      disabled: submenu.disabled,
      icon: submenu.icon,
      key,
      label: submenu.label,
      type: 'submenu',
    }
  }
  const action = item as ContextMenuItemType
  return {
    closeOnClick: action.closeOnClick,
    danger: action.danger,
    desc: action.desc,
    disabled: action.disabled,
    extra: action.extra,
    icon: action.icon,
    key,
    label: action.label,
    onClick: action.onClick
      ? (info) =>
          action.onClick?.({
            domEvent: info.domEvent,
            key: info.key,
            keyPath: info.keyPath,
          })
      : undefined,
    title: action.title,
  }
}

export function showContextMenu(items: ContextMenuItem[]): void {
  showLobeContextMenu(items.map(toLobeItem))
}

export function updateContextMenuItems(items: ContextMenuItem[]): void {
  updateLobeContextMenuItems(items.map(toLobeItem))
}

export function closeContextMenu(): void {
  closeLobeContextMenu()
}
