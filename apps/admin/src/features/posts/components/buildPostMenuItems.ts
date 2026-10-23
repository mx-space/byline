import type { ContextMenuItem as LobeMenuItem } from '@lobehub/ui'
import { toast } from '@lobehub/ui'
import { Check, Copy } from 'lucide-react'

import type { PostModel } from '~/models/post'
import type { ListAction } from '~/ui/list-actions'
import type { ContextMenuItem } from '~/ui/overlay/context-menu'

import type { PostCopy } from '../copy'

export interface PostMenuCategoryOption {
  id: string
  name: string
}

export interface BuildPostMenuItemsOptions {
  actions: ReadonlyArray<ListAction<PostModel>>
  aiLabel: string
  aiMenuItems?: ContextMenuItem[]
  categories: PostMenuCategoryOption[]
  categoryDisabled?: boolean
  copy: PostCopy
  externalHref: string
  pinDisabled?: boolean
  publishDisabled?: boolean
  onCategoryChange: (categoryId: string) => void
  onPinToggle: (next: boolean) => void
  onPublishToggle: (next: boolean) => void
}

async function copyText(
  value: string | undefined,
  label: string,
  copy: PostCopy,
) {
  if (!value) {
    toast.error(copy('copyMissing', { label }))
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    toast.success(copy('copySucceeded', { label }))
  } catch {
    toast.error(copy('copyFailed'))
  }
}

function actionToItem(
  action: ListAction<PostModel> | undefined,
  target: PostModel,
): LobeMenuItem | null {
  if (!action) return null
  return {
    danger: action.danger,
    extra: action.shortcutLabel,
    icon: action.icon,
    key: action.key,
    label: action.label,
    onClick: () => void action.run([target]),
  }
}

function adaptAiItems(items: ContextMenuItem[]): LobeMenuItem[] {
  const next: LobeMenuItem[] = []
  for (const item of items) {
    if (!item) continue
    if (item.type === 'divider') {
      next.push({ key: item.key ?? 'ai-divider', type: 'divider' })
      continue
    }
    if (
      item.type === 'checkbox' ||
      item.type === 'group' ||
      item.type === 'submenu' ||
      'children' in item
    ) {
      continue
    }
    const click = item.onClick
    next.push({
      icon: item.icon,
      key: item.key ?? 'ai-item',
      label: item.label,
      onClick: click ? () => click(undefined as never) : undefined,
    })
  }
  return next
}

export function buildPostMenuItems(
  post: PostModel,
  options: BuildPostMenuItemsOptions,
): LobeMenuItem[] {
  const find = (key: string) =>
    options.actions.find((action) => action.key === key)
  const copy = options.copy
  const items: LobeMenuItem[] = []

  const edit = actionToItem(find('edit'), post)
  if (edit) items.push(edit)
  const openExternal = actionToItem(find('open-external'), post)
  if (openExternal) items.push(openExternal)

  items.push(
    { key: 'sep-status', type: 'divider' },
    {
      checked: post.isPublished ?? false,
      disabled: options.publishDisabled,
      key: 'publish',
      label: copy('publishToggle'),
      onCheckedChange: options.onPublishToggle,
      type: 'checkbox',
    },
    {
      checked: Boolean(post.pinAt),
      disabled: options.pinDisabled,
      key: 'pin',
      label: copy('pinToggle'),
      onCheckedChange: options.onPinToggle,
      type: 'checkbox',
    },
  )

  if (options.categories.length > 0) {
    items.push({
      children: options.categories.map((category) => ({
        disabled: options.categoryDisabled,
        icon: category.id === post.categoryId ? Check : undefined,
        key: `category-${category.id}`,
        label: category.name,
        onClick: () => {
          if (category.id !== post.categoryId)
            options.onCategoryChange(category.id)
        },
      })),
      key: 'category',
      label: copy('changeCategory'),
      type: 'submenu',
    })
  }

  const aiItems = options.aiMenuItems?.length
    ? adaptAiItems(options.aiMenuItems)
    : []
  if (aiItems.length > 0) {
    items.push(
      { key: 'sep-ai', type: 'divider' },
      {
        children: aiItems,
        key: 'ai',
        label: options.aiLabel,
        type: 'submenu',
      },
    )
  }

  items.push(
    { key: 'sep-copy', type: 'divider' },
    {
      icon: Copy,
      key: 'copy-link',
      label: copy('copyLink'),
      onClick: () =>
        void copyText(options.externalHref, copy('copyLabelLink'), copy),
    },
    {
      key: 'copy-id',
      label: copy('copyId'),
      onClick: () => void copyText(post.id, copy('copyLabelId'), copy),
    },
    {
      key: 'copy-slug',
      label: copy('copySlug'),
      onClick: () => void copyText(post.slug, copy('copyLabelSlug'), copy),
    },
  )

  const remove = actionToItem(find('delete'), post)
  if (remove) items.push({ key: 'sep-delete', type: 'divider' }, remove)

  return items
}
