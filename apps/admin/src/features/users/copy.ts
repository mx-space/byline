import { useCallback } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

export const usersCopy = createFeatureCopy({
  addAuthor: {
    'en-US': 'Add byline profile',
    'zh-CN': '添加署名',
  },
  addAuthorHint: {
    'en-US': 'A byline profile only. This person cannot sign in.',
    'zh-CN': '只用于文章署名，不能登录。',
  },
  avatarFailed: {
    'en-US': 'The avatar did not upload. Try another image.',
    'zh-CN': '头像没有上传。换一张图片重试。',
  },
  avatarUrl: {
    'en-US': 'Avatar URL',
    'zh-CN': '头像地址',
  },
  bio: {
    'en-US': 'Bio',
    'zh-CN': '简介',
  },
  bylinePlace: {
    'en-US': 'Byline place {place}',
    'zh-CN': '署名第 {place} 位',
  },
  cancel: {
    'en-US': 'Cancel',
    'zh-CN': '取消',
  },
  clearFilters: {
    'en-US': 'Clear filters',
    'zh-CN': '清除筛选',
  },
  close: {
    'en-US': 'Close',
    'zh-CN': '关闭',
  },
  columnEmail: {
    'en-US': 'Email',
    'zh-CN': '邮箱',
  },
  columnName: {
    'en-US': 'Name',
    'zh-CN': '名字',
  },
  columnStatus: {
    'en-US': 'Account status',
    'zh-CN': '账号状态',
  },
  copied: {
    'en-US': 'Copied',
    'zh-CN': '已复制',
  },
  copyLink: {
    'en-US': 'Copy link',
    'zh-CN': '复制链接',
  },
  createAuthor: {
    'en-US': 'Create byline profile',
    'zh-CN': '创建署名',
  },
  currentAccount: {
    'en-US': 'Current account',
    'zh-CN': '当前账号',
  },
  deactivate: {
    'en-US': 'Deactivate',
    'zh-CN': '停用',
  },
  deactivateBody: {
    'en-US': 'Posts and the byline stay. This person can no longer sign in.',
    'zh-CN': '停用后保留文章和署名，此人不能再登录。',
  },
  deactivated: {
    'en-US': 'Deactivated',
    'zh-CN': '已停用',
  },
  deactivatedAt: {
    'en-US': 'Deactivated',
    'zh-CN': '停用时间',
  },
  deactivateSelf: {
    'en-US': 'The current account cannot be deactivated.',
    'zh-CN': '不能停用当前账号。',
  },
  deactivateTitle: {
    'en-US': 'Deactivate {name}?',
    'zh-CN': '停用 {name}？',
  },
  description: {
    'en-US': 'Find a person, then invite, deactivate, or edit the profile.',
    'zh-CN': '找到一个人，邀请、停用，或修改资料。',
  },
  detailError: {
    'en-US': 'This profile did not load. Retry.',
    'zh-CN': '这个人的资料没有加载出来。重试。',
  },
  displayName: {
    'en-US': 'Display name',
    'zh-CN': '显示名称',
  },
  displayNameRequired: {
    'en-US': 'Enter a display name',
    'zh-CN': '填写显示名称',
  },
  done: {
    'en-US': 'Done',
    'zh-CN': '完成',
  },
  email: {
    'en-US': 'Email',
    'zh-CN': '邮箱',
  },
  emailInvalid: {
    'en-US': 'Email format is invalid',
    'zh-CN': '邮箱格式有误',
  },
  emailNotQueued: {
    'en-US': 'No email was sent. Copy the link to send it.',
    'zh-CN': '邮件未发出。复制链接发送。',
  },
  emailQueued: {
    'en-US': 'An invite email was sent to {email}.',
    'zh-CN': '已向 {email} 发送邀请邮件。',
  },
  emailRequired: {
    'en-US': 'Enter an email',
    'zh-CN': '填写邮箱',
  },
  emptyFiltered: {
    'en-US': 'No users match these filters',
    'zh-CN': '没有符合条件的用户',
  },
  emptyTitle: {
    'en-US': 'No users yet',
    'zh-CN': '还没有用户',
  },
  enable: {
    'en-US': 'Enable',
    'zh-CN': '启用',
  },
  enabled: {
    'en-US': 'Enabled',
    'zh-CN': '已启用',
  },
  expired: {
    'en-US': 'Expired',
    'zh-CN': '已过期',
  },
  expiresAt: {
    'en-US': 'Expires {time}',
    'zh-CN': '{time} 到期',
  },
  filterStatus: {
    'en-US': 'Account status',
    'zh-CN': '账号状态',
  },
  identityLocked: {
    'en-US': 'Only this person can change the email and username.',
    'zh-CN': '邮箱和用户名只能由本人修改。',
  },
  invite: {
    'en-US': 'Invite',
    'zh-CN': '邀请',
  },
  inviteCreated: {
    'en-US': 'Invite created',
    'zh-CN': '邀请已创建',
  },
  inviteExistingTitle: {
    'en-US': 'Invite {name} to sign in',
    'zh-CN': '邀请 {name} 登录',
  },
  inviteFailed: {
    'en-US': 'The invite was not sent. Check the email and retry.',
    'zh-CN': '邀请没有发出。检查邮箱后重试。',
  },
  inviteSignIn: {
    'en-US': 'Invite to sign in',
    'zh-CN': '邀请登录',
  },
  inviteSubmit: {
    'en-US': 'Send invite',
    'zh-CN': '发送邀请',
  },
  lastLogin: {
    'en-US': 'Last sign-in',
    'zh-CN': '最近登录',
  },
  linkAuthor: {
    'en-US': 'Link an existing byline',
    'zh-CN': '关联已有署名',
  },
  linkAuthorHint: {
    'en-US':
      'Accepting the invite turns this byline into a sign-in account. Posts and the byline stay attached.',
    'zh-CN': '接受邀请后，该署名变为可登录账号。文章和署名仍挂在此人名下。',
  },
  linkAuthorNone: {
    'en-US': 'None, create a new account',
    'zh-CN': '不关联，新建账号',
  },
  linked: {
    'en-US': 'Existing byline',
    'zh-CN': '已有署名',
  },
  listError: {
    'en-US': 'The user list did not load. Check the network and retry.',
    'zh-CN': '用户列表没有加载出来。检查网络后重试。',
  },
  listStale: {
    'en-US': 'Refresh failed. Showing the last result.',
    'zh-CN': '刷新失败，仍显示上次的结果。',
  },
  loading: {
    'en-US': 'Loading users',
    'zh-CN': '正在加载用户',
  },
  loadingAuthors: {
    'en-US': 'Loading byline profiles',
    'zh-CN': '正在加载署名',
  },
  notFound: {
    'en-US': 'User not found.',
    'zh-CN': '未找到该用户。',
  },
  pendingTitle: {
    'en-US': 'Pending invites',
    'zh-CN': '待接受邀请',
  },
  postsError: {
    'en-US':
      'Byline posts did not load. The profile is still available. Retry.',
    'zh-CN': '署名文章没有加载出来。资料仍可用。重试。',
  },
  postsMore: {
    'en-US': '{count} more',
    'zh-CN': '还有 {count} 篇',
  },
  postsTitle: {
    'en-US': 'Byline posts',
    'zh-CN': '署名文章',
  },
  profileOnlyHint: {
    'en-US': 'Byline only. This person cannot sign in.',
    'zh-CN': '仅用于署名，不能登录。',
  },
  retry: {
    'en-US': 'Retry',
    'zh-CN': '重试',
  },
  revoke: {
    'en-US': 'Revoke invite',
    'zh-CN': '撤回邀请',
  },
  revoked: {
    'en-US': 'Invite revoked',
    'zh-CN': '邀请已撤回',
  },
  revokeBody: {
    'en-US': 'The link will stop working.',
    'zh-CN': '链接将失效。',
  },
  revokeFailed: {
    'en-US': 'The invite was not revoked. Retry.',
    'zh-CN': '邀请没有撤回。重试。',
  },
  revokeTitle: {
    'en-US': 'Revoke the invite for {email}?',
    'zh-CN': '撤回发给 {email} 的邀请？',
  },
  saveFailed: {
    'en-US': 'The profile was not saved. Check it and retry.',
    'zh-CN': '资料没有保存。检查后重试。',
  },
  saved: {
    'en-US': 'Profile saved',
    'zh-CN': '资料已保存',
  },
  saveProfile: {
    'en-US': 'Save profile',
    'zh-CN': '保存资料',
  },
  searchPlaceholder: {
    'en-US': 'Search name or email',
    'zh-CN': '搜索名字或邮箱',
  },
  statusActive: {
    'en-US': 'Can sign in',
    'zh-CN': '可登录',
  },
  statusAll: {
    'en-US': 'All',
    'zh-CN': '全部',
  },
  statusDeactivated: {
    'en-US': 'Deactivated',
    'zh-CN': '已停用',
  },
  statusFailed: {
    'en-US': 'The account status did not change. Retry.',
    'zh-CN': '账号状态没有改成。重试。',
  },
  statusProfileOnly: {
    'en-US': 'Byline only',
    'zh-CN': '仅署名',
  },
  title: {
    'en-US': 'Users',
    'zh-CN': '用户',
  },
  uploadAvatar: {
    'en-US': 'Upload avatar',
    'zh-CN': '上传头像',
  },
  url: {
    'en-US': 'Website',
    'zh-CN': '网站',
  },
  username: {
    'en-US': 'Username',
    'zh-CN': '用户名',
  },
  authorFailed: {
    'en-US': 'The byline profile was not created. Check it and retry.',
    'zh-CN': '署名没有创建。检查后重试。',
  },
  authorsError: {
    'en-US': 'Byline profiles did not load. An invite can still be sent.',
    'zh-CN': '署名列表没有加载出来。仍可直接发送邀请。',
  },
  invitesError: {
    'en-US':
      'Pending invites did not load. The user list is still available. Retry.',
    'zh-CN': '待接受邀请没有加载出来。用户列表仍可用。重试。',
  },
})

export function useUsersCopy() {
  const { locale } = useI18n()
  return useCallback(
    (
      key: Parameters<typeof usersCopy>[1],
      values?: Record<string, number | string>,
    ) => usersCopy(locale, key, values),
    [locale],
  )
}
