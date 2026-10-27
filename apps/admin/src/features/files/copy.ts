import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

const catalog = {
  allSelected: {
    'en-US': 'All {count} selected',
    'zh-CN': '已选全部 {count} 个',
  },
  backToList: {
    'en-US': 'Back to files',
    'zh-CN': '返回文件',
  },
  cancel: {
    'en-US': 'Cancel',
    'zh-CN': '取消',
  },
  changeActive: {
    'en-US': 'Mark referenced',
    'zh-CN': '标为被引用',
  },
  changeDiscovered: {
    'en-US': 'Register local files',
    'zh-CN': '补录本地文件',
  },
  changePending: {
    'en-US': 'Mark orphan',
    'zh-CN': '标为孤立',
  },
  changeUsages: {
    'en-US': 'Update usage links',
    'zh-CN': '更新引用关系',
  },
  checkReferences: {
    'en-US': 'Check references',
    'zh-CN': '检查引用',
  },
  cleanupAll: {
    'en-US': 'Clean up all',
    'zh-CN': '全部清理',
  },
  cleanupBody: {
    'en-US':
      'Files uploaded in the last {minutes} minutes are kept, since they may belong to a post that is not saved yet. Deletion cannot be undone.',
    'zh-CN':
      '最近 {minutes} 分钟内上传的会保留，它们可能属于还没保存的文章。删除后无法恢复。',
  },
  cleanupBodyExact: {
    'en-US':
      '{kept} files uploaded in the last {minutes} minutes are kept, since they may belong to a post that is not saved yet. Deletion cannot be undone.',
    'zh-CN':
      '最近 {minutes} 分钟内上传的 {kept} 个会保留，它们可能属于还没保存的文章。删除后无法恢复。',
  },
  cleanupConfirm: {
    'en-US': 'Clean up',
    'zh-CN': '清理',
  },
  cleanupFailed: {
    'en-US': 'Cleanup did not finish. The files are still there. Retry.',
    'zh-CN': '清理没有完成，文件仍在。请重试。',
  },
  cleanupNothing: {
    'en-US':
      'Every orphan file was uploaded in the last {minutes} minutes. Nothing to clean up yet.',
    'zh-CN': '孤立文件都是最近 {minutes} 分钟内上传的，暂时没有可清理的。',
  },
  cleanupResult: {
    'en-US': 'Cleaned up {count} files',
    'zh-CN': '已清理 {count} 个文件',
  },
  cleanupTitle: {
    'en-US': 'Clean up orphan files? ({count} in total)',
    'zh-CN': '清理孤立文件？（共 {count} 个）',
  },
  cleanupTitleExact: {
    'en-US': 'Delete {count} orphan files{size}?',
    'zh-CN': '删除 {count} 个孤立文件{size}？',
  },
  clearFilters: {
    'en-US': 'Clear filters',
    'zh-CN': '清除筛选',
  },
  clearSearch: {
    'en-US': 'Clear search',
    'zh-CN': '清除搜索',
  },
  clearSelection: {
    'en-US': 'Clear selection',
    'zh-CN': '取消选择',
  },
  close: {
    'en-US': 'Close',
    'zh-CN': '关闭',
  },
  columnName: {
    'en-US': 'Name',
    'zh-CN': '名称',
  },
  columnState: {
    'en-US': 'History',
    'zh-CN': '来历',
  },
  copied: {
    'en-US': 'Link copied',
    'zh-CN': '已复制链接',
  },
  copyFailed: {
    'en-US': 'The link was not copied. Retry.',
    'zh-CN': '链接没有复制成功，请重试。',
  },
  copyLink: {
    'en-US': 'Copy link',
    'zh-CN': '复制链接',
  },
  delete: {
    'en-US': 'Delete',
    'zh-CN': '删除',
  },
  deleteBatchBody: {
    'en-US': 'No post references these files. Deletion cannot be undone.',
    'zh-CN': '没有文章引用这些文件。删除后无法恢复。',
  },
  deleteBatchConfirm: {
    'en-US': 'Delete {count} files',
    'zh-CN': '删除 {count} 个文件',
  },
  deleteBatchTitle: {
    'en-US': 'Delete {count} orphan files{size}?',
    'zh-CN': '删除 {count} 个孤立文件{size}？',
  },
  deleteFailedBatch: {
    'en-US': 'Delete did not finish. {failed} files are still there. Retry.',
    'zh-CN': '删除没有完成，{failed} 个文件仍在。请重试。',
  },
  deleteFailedNamed: {
    'en-US': 'Could not delete {name}. The file is still there. Retry.',
    'zh-CN': '没有删除 {name}，文件仍在。请重试。',
  },
  deleteFile: {
    'en-US': 'Delete file',
    'zh-CN': '删除文件',
  },
  deleteFileBody: {
    'en-US':
      'Byline cannot tell whether a post still uses this file. If one does, its image or link will break. Deletion cannot be undone.',
    'zh-CN':
      '无法确认是否还有文章在用这个文件。如果有，文章里的图片或链接会失效。删除后无法恢复。',
  },
  deleteFileTitle: {
    'en-US': 'Delete {name}?',
    'zh-CN': '删除 {name}？',
  },
  deleteInUseBody: {
    'en-US':
      'A post or setting still uses this file. Its image or link will break. Deletion cannot be undone.',
    'zh-CN':
      '仍有文章或设置在用这个文件，删除后那里的图片或链接会失效。删除后无法恢复。',
  },
  deleteOneBody: {
    'en-US': 'No post references this file. Deletion cannot be undone.',
    'zh-CN': '没有文章引用这个文件。删除后无法恢复。',
  },
  deleteResult: {
    'en-US': 'Deleted {success}. {failed} failed.',
    'zh-CN': '已删除 {success} 个，失败 {failed} 个。',
  },
  deleteSelected: {
    'en-US': 'Delete selected',
    'zh-CN': '删除所选',
  },
  deletedNamed: {
    'en-US': 'Deleted {name}',
    'zh-CN': '已删除 {name}',
  },
  detailsTitle: {
    'en-US': 'Details',
    'zh-CN': '详情',
  },
  download: {
    'en-US': 'Download',
    'zh-CN': '下载',
  },
  dropAny: {
    'en-US': 'Any file type',
    'zh-CN': '任意类型',
  },
  dropImage: {
    'en-US': 'Images only, saved to {type}',
    'zh-CN': '仅图片，存入「{type}」',
  },
  dropTitle: {
    'en-US': 'Drop to upload',
    'zh-CN': '松开以上传',
  },
  emptyLibraryBody: {
    'en-US': 'Upload a file, or drop one onto this page.',
    'zh-CN': '上传文件，或把文件拖到这个页面。',
  },
  emptyLibraryTitle: {
    'en-US': 'No files in {type}',
    'zh-CN': '「{type}」里还没有文件',
  },
  emptyOrphanSearchBody: {
    'en-US': 'Search only covers this page.',
    'zh-CN': '搜索只覆盖当前页。',
  },
  emptyOrphansBody: {
    'en-US':
      'Every file is used by a post. Check references if this looks wrong.',
    'zh-CN': '所有文件都有文章在用。如果不对，先检查引用。',
  },
  emptyOrphansTitle: {
    'en-US': 'No orphan files',
    'zh-CN': '没有孤立文件',
  },
  emptyRemoteBody: {
    'en-US':
      'Images and attachments uploaded while object storage is on appear here.',
    'zh-CN': '开启对象存储后上传的图片和附件会显示在这里。',
  },
  emptyRemoteTitle: {
    'en-US': 'No files in the bucket',
    'zh-CN': '存储桶里还没有文件',
  },
  emptySearchTitle: {
    'en-US': 'No matching files',
    'zh-CN': '没有匹配的文件',
  },
  fieldDimensions: {
    'en-US': 'Dimensions',
    'zh-CN': '尺寸',
  },
  fieldMime: {
    'en-US': 'MIME type',
    'zh-CN': 'MIME 类型',
  },
  fieldSize: {
    'en-US': 'Size',
    'zh-CN': '大小',
  },
  fieldType: {
    'en-US': 'Type',
    'zh-CN': '类型',
  },
  fieldUploaded: {
    'en-US': 'Uploaded',
    'zh-CN': '上传时间',
  },
  fieldUrl: {
    'en-US': 'Link',
    'zh-CN': '链接',
  },
  libraryDescription: {
    'en-US': 'Images and attachments uploaded for posts.',
    'zh-CN': '文章用到的图片和附件。',
  },
  libraryTitle: {
    'en-US': 'Files',
    'zh-CN': '文件',
  },
  loadFailedBody: {
    'en-US': 'The list did not update. Retry.',
    'zh-CN': '列表没有更新，请重试。',
  },
  loadFailedTitle: {
    'en-US': 'Could not load files',
    'zh-CN': '文件加载失败',
  },
  loadOrphansFailedBody: {
    'en-US': 'The orphan list did not update. Retry.',
    'zh-CN': '孤立文件列表没有更新，请重试。',
  },
  loadOrphansFailedTitle: {
    'en-US': 'Could not load orphan files',
    'zh-CN': '孤立文件加载失败',
  },
  loadRemoteFailedBody: {
    'en-US': 'The bucket file list did not update. Retry.',
    'zh-CN': '存储桶文件列表没有更新，请重试。',
  },
  loadRemoteFailedTitle: {
    'en-US': 'Could not load bucket files',
    'zh-CN': '存储桶文件加载失败',
  },
  loading: {
    'en-US': 'Loading…',
    'zh-CN': '加载中…',
  },
  metricIsolated: {
    'en-US': 'Orphan files',
    'zh-CN': '孤立文件',
  },
  metricReferenced: {
    'en-US': 'Referenced files',
    'zh-CN': '被引用文件',
  },
  metricScanned: {
    'en-US': 'Scanned files',
    'zh-CN': '扫描文件',
  },
  metricUsages: {
    'en-US': 'Usage links',
    'zh-CN': '引用关系',
  },
  missingFileBody: {
    'en-US': 'It may have been deleted, or it is filed under another type.',
    'zh-CN': '它可能已删除，或在其他类型里。',
  },
  missingFileTitle: {
    'en-US': 'File not found',
    'zh-CN': '未找到这个文件',
  },
  missingOrphanBody: {
    'en-US': 'It may have been deleted, or it is not on this page.',
    'zh-CN': '它可能已删除，或不在当前页。',
  },
  missingOrphanTitle: {
    'en-US': 'Orphan file not found',
    'zh-CN': '未找到这个孤立文件',
  },
  notImage: {
    'en-US': '{name} is not an image and was not uploaded.',
    'zh-CN': '{name} 不是图片，没有上传。',
  },
  openDetails: {
    'en-US': 'Open details',
    'zh-CN': '查看详情',
  },
  openFile: {
    'en-US': 'Open in new tab',
    'zh-CN': '在新标签页打开',
  },
  openSource: {
    'en-US': 'Open the {source}',
    'zh-CN': '打开这篇{source}',
  },
  orphanExplain: {
    'en-US':
      'Orphan files are not used by any post. Cleanup keeps files uploaded in the last {minutes} minutes.',
    'zh-CN':
      '孤立文件是没有任何文章在用的文件。清理时会保留最近 {minutes} 分钟内上传的。',
  },
  reconcileApply: {
    'en-US': 'Update reference status',
    'zh-CN': '更新引用状态',
  },
  reconcileApplying: {
    'en-US': 'Updating references…',
    'zh-CN': '正在更新引用…',
  },
  reconcileChanges: {
    'en-US': 'Pending updates',
    'zh-CN': '将要更新',
  },
  reconcileDone: {
    'en-US':
      'References updated. {active} referenced, {isolated} orphan, {usages} usage links.',
    'zh-CN':
      '引用已更新。被引用 {active} 个，孤立 {isolated} 个，引用关系 {usages} 条。',
  },
  reconcileFailed: {
    'en-US': 'Reference check failed. Nothing changed. Retry.',
    'zh-CN': '引用检查失败，没有改动。请重试。',
  },
  reconcileSafety: {
    'en-US': 'Checking and updating never delete files.',
    'zh-CN': '检查和更新都不会删除文件。',
  },
  reconcileScanning: {
    'en-US': 'Checking references…',
    'zh-CN': '正在检查引用…',
  },
  reconcileTitle: {
    'en-US': 'Update reference status?',
    'zh-CN': '更新引用状态？',
  },
  reconcileUpToDate: {
    'en-US': 'Reference status is already current',
    'zh-CN': '引用状态已是最新',
  },
  referencesDetached: {
    'en-US': 'Used to be in a {source}; the reference has since been removed.',
    'zh-CN': '曾用在一篇{source}里，后来引用被移除。',
  },
  referencesDetachedAt: {
    'en-US': 'Used to be in a {source}; the reference was removed {time}.',
    'zh-CN': '曾用在一篇{source}里，{time}移除了引用。',
  },
  referencesNever: {
    'en-US': 'No post has ever used this file.',
    'zh-CN': '还没有文章用过这个文件。',
  },
  referencesTitle: {
    'en-US': 'Used by',
    'zh-CN': '引用',
  },
  referencesUnknown: {
    'en-US': 'The file API does not report which posts use this file.',
    'zh-CN': '文件接口不提供引用它的文章。',
  },
  refresh: {
    'en-US': 'Refresh',
    'zh-CN': '刷新',
  },
  remoteExplain: {
    'en-US':
      'Files Byline uploaded to object storage. Objects added to the bucket by other tools are not listed.',
    'zh-CN':
      'Byline 上传到对象存储的文件。其他工具直接放进存储桶的对象不在这里。',
  },
  retry: {
    'en-US': 'Retry',
    'zh-CN': '重试',
  },
  searchLabel: {
    'en-US': 'Search by file name',
    'zh-CN': '按文件名搜索',
  },
  searchPlaceholder: {
    'en-US': 'Search file names',
    'zh-CN': '搜索文件名',
  },
  selectEvery: {
    'en-US': 'Select all {count}',
    'zh-CN': '选择全部 {count} 个',
  },
  selectedCount: {
    'en-US': '{count} selected',
    'zh-CN': '已选 {count} 个',
  },
  sizeSuffix: {
    'en-US': ' ({size})',
    'zh-CN': '（{size}）',
  },
  sourceDraft: {
    'en-US': 'draft',
    'zh-CN': '草稿',
  },
  sourcePost: {
    'en-US': 'post',
    'zh-CN': '文章',
  },
  stateDetached: {
    'en-US': 'Reference removed',
    'zh-CN': '引用已移除',
  },
  stateInUse: {
    'en-US': 'In use',
    'zh-CN': '使用中',
  },
  stateNeverUsed: {
    'en-US': 'Never used',
    'zh-CN': '从未使用',
  },
  stateUnused: {
    'en-US': 'Not used',
    'zh-CN': '未使用',
  },
  tabLocal: {
    'en-US': 'Local files',
    'zh-CN': '本地文件',
  },
  tabOrphans: {
    'en-US': 'Orphan files',
    'zh-CN': '孤立文件',
  },
  tabRemote: {
    'en-US': 'Bucket',
    'zh-CN': '存储桶',
  },
  tabsLabel: {
    'en-US': 'File views',
    'zh-CN': '文件视图',
  },
  typeAvatar: {
    'en-US': 'Avatars',
    'zh-CN': '头像',
  },
  typeFile: {
    'en-US': 'Attachments',
    'zh-CN': '附件',
  },
  typeIcon: {
    'en-US': 'Icons',
    'zh-CN': '图标',
  },
  typeImage: {
    'en-US': 'Images',
    'zh-CN': '图片',
  },
  typeLabel: {
    'en-US': 'File type',
    'zh-CN': '文件类型',
  },
  upload: {
    'en-US': 'Upload',
    'zh-CN': '上传',
  },
  uploadDone: {
    'en-US': 'Upload finished',
    'zh-CN': '上传完成',
  },
  uploadErrors: {
    'en-US': '{count} uploads failed',
    'zh-CN': '{count} 个上传失败',
  },
  uploadFailed: {
    'en-US': 'Upload failed. Check the file and retry.',
    'zh-CN': '上传失败，检查文件后重试。',
  },
  uploadProgress: {
    'en-US': 'Uploading {count}',
    'zh-CN': '正在上传 {count} 个',
  },
  uploadResult: {
    'en-US': 'Uploaded {success}. {failed} failed.',
    'zh-CN': '已上传 {success} 个，失败 {failed} 个。',
  },
  uploadedRelative: {
    'en-US': 'Uploaded {time}',
    'zh-CN': '{time}上传',
  },
  uploading: {
    'en-US': 'Uploading',
    'zh-CN': '上传中',
  },
  viewGrid: {
    'en-US': 'Grid',
    'zh-CN': '网格',
  },
  viewLabel: {
    'en-US': 'View',
    'zh-CN': '视图',
  },
  viewLarge: {
    'en-US': 'View full size',
    'zh-CN': '查看大图',
  },
  viewList: {
    'en-US': 'List',
    'zh-CN': '列表',
  },
} as const

export type FileCopyKey = keyof typeof catalog

export const fileCopy = createFeatureCopy(catalog)

export function useFileCopy() {
  const { locale } = useI18n()
  return (key: FileCopyKey, values?: Record<string, number | string>) =>
    fileCopy(locale, key, values)
}
