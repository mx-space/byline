import { useMemo } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

const catalog = {
  cancel: { 'en-US': 'Cancel', 'zh-CN': '取消' },
  clearSearch: { 'en-US': 'Clear search', 'zh-CN': '清除搜索' },
  columnCount: { 'en-US': 'Posts', 'zh-CN': '文章数' },
  columnCreated: { 'en-US': 'Created', 'zh-CN': '创建' },
  columnName: { 'en-US': 'Name', 'zh-CN': '名称' },
  create: { 'en-US': 'New category', 'zh-CN': '新建分类' },
  created: { 'en-US': 'Category created', 'zh-CN': '分类已创建' },
  delete: { 'en-US': 'Delete', 'zh-CN': '删除' },
  deleteBlocked: {
    'en-US': 'Move its {count} posts to another category first.',
    'zh-CN': '先把这 {count} 篇文章移到其他分类，再删除。',
  },
  deleteBody: {
    'en-US': 'This cannot be undone.',
    'zh-CN': '删除后无法恢复。',
  },
  deleteFailed: {
    'en-US': '"{name}" was not deleted. Try again.',
    'zh-CN': '没有删除「{name}」，可以再试一次。',
  },
  deleteHasPosts: {
    'en-US':
      '"{name}" still has posts. Move them to another category, then delete it.',
    'zh-CN': '「{name}」下还有文章。把文章移到其他分类后再删除。',
  },
  deleteLast: {
    'en-US':
      'This is the last category, so one named Default is created in its place.',
    'zh-CN': '这是最后一个分类，删除后会自动留下名为 Default 的分类。',
  },
  deleteTitle: { 'en-US': 'Delete "{name}"?', 'zh-CN': '删除「{name}」？' },
  deleted: { 'en-US': 'Category deleted', 'zh-CN': '分类已删除' },
  deletedWithDefault: {
    'en-US': 'Category deleted. A category named Default was left in place.',
    'zh-CN': '分类已删除，已留下名为 Default 的分类。',
  },
  description: {
    'en-US': 'Group posts by topic. The slug appears in public URLs.',
    'zh-CN': '按主题归档文章，slug 会出现在公开 URL 中。',
  },
  detailLoadErrorTitle: {
    'en-US': 'This category did not load',
    'zh-CN': '这个分类没有加载出来',
  },
  discardBody: {
    'en-US': 'The name and slug you changed are not saved.',
    'zh-CN': '改过的名称和 slug 还没保存。',
  },
  discardConfirm: { 'en-US': 'Discard', 'zh-CN': '放弃修改' },
  discardTitle: { 'en-US': 'Discard changes?', 'zh-CN': '放弃未保存的修改？' },
  edit: { 'en-US': 'Edit', 'zh-CN': '编辑' },
  editTitle: { 'en-US': 'Edit category', 'zh-CN': '编辑分类' },
  emptyDescription: {
    'en-US': 'Create a category so posts can be filed under it.',
    'zh-CN': '新建一个分类，文章就可以归到这里。',
  },
  emptyTitle: { 'en-US': 'No categories yet', 'zh-CN': '还没有分类' },
  emptyValue: { 'en-US': '--', 'zh-CN': '--' },
  filterEmptyTitle: {
    'en-US': 'No matching categories',
    'zh-CN': '没有符合条件的分类',
  },
  forbiddenDescription: {
    'en-US': 'A signed-in admin session is required.',
    'zh-CN': '需要已登录的管理权限。',
  },
  forbiddenTitle: {
    'en-US': 'No permission to view categories',
    'zh-CN': '无权限查看分类',
  },
  keepEditing: { 'en-US': 'Keep editing', 'zh-CN': '继续编辑' },
  loadErrorTitle: {
    'en-US': 'Categories did not load',
    'zh-CN': '分类没有加载出来',
  },
  nameLabel: { 'en-US': 'Name', 'zh-CN': '名称' },
  namePlaceholder: { 'en-US': 'Product updates', 'zh-CN': '产品更新' },
  nameRequired: { 'en-US': 'Enter a name', 'zh-CN': '填写名称' },
  noPosts: {
    'en-US': 'No posts in this category yet.',
    'zh-CN': '这个分类下还没有文章。',
  },
  notFoundDescription: {
    'en-US': 'It may have been deleted.',
    'zh-CN': '它可能已被删除。',
  },
  notFoundTitle: { 'en-US': 'Category not found', 'zh-CN': '未找到这个分类' },
  retry: { 'en-US': 'Try again', 'zh-CN': '重试' },
  save: { 'en-US': 'Save', 'zh-CN': '保存' },
  saveFailed: {
    'en-US': 'Not saved. What you typed is still here. Try again.',
    'zh-CN': '没有保存，已填写的内容还在，可以再试一次。',
  },
  saved: { 'en-US': 'Category saved', 'zh-CN': '分类已保存' },
  searchPlaceholder: {
    'en-US': 'Search name or slug',
    'zh-CN': '搜索名称或 slug',
  },
  slugHint: {
    'en-US': 'Filled from the name until you edit it. Used in public URLs.',
    'zh-CN': '未手动修改前随名称自动生成，用于公开 URL。',
  },
  slugLabel: { 'en-US': 'Slug', 'zh-CN': 'Slug' },
  slugPlaceholder: { 'en-US': 'product-updates', 'zh-CN': 'product-updates' },
  slugRequired: { 'en-US': 'Enter a slug', 'zh-CN': '填写 slug' },
  staleDescription: {
    'en-US': 'Showing the last loaded categories.',
    'zh-CN': '显示的是上次加载的分类。',
  },
  staleTitle: {
    'en-US': 'Categories did not refresh',
    'zh-CN': '分类没有刷新',
  },
  title: { 'en-US': 'Categories', 'zh-CN': '分类' },
  viewPosts: { 'en-US': 'View {count} posts', 'zh-CN': '查看 {count} 篇文章' },
  viewPostsOne: { 'en-US': 'View 1 post', 'zh-CN': '查看 1 篇文章' },
  viewPostsTitle: {
    'en-US': 'Open the posts in this category',
    'zh-CN': '查看这个分类下的文章',
  },
} as const

export type CategoryCopyKey = keyof typeof catalog

export const categoryCopy = createFeatureCopy(catalog)

export function useCategoryCopy() {
  const { format, locale } = useI18n()
  const text = useMemo(() => {
    return (key: CategoryCopyKey, values?: Record<string, number | string>) =>
      categoryCopy(locale, key, values)
  }, [locale])

  return { format, locale, text }
}
