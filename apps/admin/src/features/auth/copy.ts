import { createFeatureCopy } from '~/i18n/feature-copy'

export const authCopyCatalog = {
  oauthReturnedError: {
    'en-US': 'Third-party sign-in was not completed',
    'zh-CN': '第三方登录未完成',
  },
  loginHeading: { 'en-US': 'Sign in to Byline', 'zh-CN': '登录 Byline' },
  inviteOnly: {
    'en-US': 'Invited accounts only. Contact an administrator to join.',
    'zh-CN': '仅限受邀账号访问。需要加入请联系站点管理员。',
  },
  acceptFailedDetail: {
    'en-US': 'Check the fields and try again.',
    'zh-CN': '检查填写内容后再试。',
  },
  acceptFailedTitle: {
    'en-US': 'Could not accept the invite',
    'zh-CN': '未能接受邀请',
  },
  acceptInvite: {
    'en-US': 'Accept invite',
    'zh-CN': '接受邀请',
  },
  accountHint: {
    'en-US': 'Username or email',
    'zh-CN': '用户名或邮箱',
  },
  accountLabel: {
    'en-US': 'Account',
    'zh-CN': '账号',
  },
  accountRequired: {
    'en-US': 'Enter an account',
    'zh-CN': '填写账号',
  },
  confirmPasswordLabel: {
    'en-US': 'Confirm password',
    'zh-CN': '确认密码',
  },
  confirmRequired: {
    'en-US': 'Enter the password again',
    'zh-CN': '再次填写密码',
  },
  credentialFailed: {
    'en-US':
      'Account or password is incorrect. Check them and sign in again, or reset the password.',
    'zh-CN': '账号或密码不正确。检查后再登录，或重置密码。',
  },
  displayNameLabel: {
    'en-US': 'Display name',
    'zh-CN': '显示名',
  },
  editEmail: {
    'en-US': 'Edit email',
    'zh-CN': '修改邮箱',
  },
  emailInvalid: {
    'en-US': 'Email format is invalid. Use a form like name@example.com.',
    'zh-CN': '邮箱格式有误。按 name@example.com 这种格式填写。',
  },
  emailLabel: {
    'en-US': 'Email',
    'zh-CN': '邮箱',
  },
  emailRequired: {
    'en-US': 'Enter an email',
    'zh-CN': '填写邮箱',
  },
  emailTakenTitle: {
    'en-US': 'This email already has an account',
    'zh-CN': '该邮箱已有账号',
  },
  goLogin: {
    'en-US': 'Go to sign in',
    'zh-CN': '前往登录',
  },
  initFailedDetail: {
    'en-US': 'Retry.',
    'zh-CN': '重试。',
  },
  initFailedTitle: {
    'en-US': 'Could not check site status',
    'zh-CN': '无法确认站点状态',
  },
  inviteAccepted: {
    'en-US': 'Sign-in credentials are set',
    'zh-CN': '已设置登录凭证',
  },
  inviteAcceptedDetail: {
    'en-US': 'Sign in.',
    'zh-CN': '前往登录。',
  },
  inviteAcceptedTitle: {
    'en-US': 'Invite already used',
    'zh-CN': '邀请已使用',
  },
  inviteExpiredDetail: {
    'en-US': 'Ask an administrator for a new invite.',
    'zh-CN': '向管理员重新申请邀请。',
  },
  inviteExpiredTitle: {
    'en-US': 'Invite has expired',
    'zh-CN': '邀请已过期',
  },
  inviteFor: {
    'en-US': 'Set sign-in credentials for {email}',
    'zh-CN': '为 {email} 设置登录凭证',
  },
  inviteNotFoundDetail: {
    'en-US': 'Ask an administrator for a new invite.',
    'zh-CN': '向管理员重新申请邀请。',
  },
  inviteNotFoundTitle: {
    'en-US': 'Invite link is invalid',
    'zh-CN': '邀请链接无效',
  },
  inviteTitle: {
    'en-US': 'Accept invite',
    'zh-CN': '接受邀请',
  },
  inviteUnknownDetail: {
    'en-US': 'Retry, or go to sign in.',
    'zh-CN': '重试，或前往登录。',
  },
  inviteUnknownTitle: {
    'en-US': 'Could not check this invite',
    'zh-CN': '无法确认邀请是否有效',
  },
  loginDescription: {
    'en-US': 'Sign in with an existing account.',
    'zh-CN': '使用已有账号进入后台。',
  },
  loginTitle: {
    'en-US': 'Sign in',
    'zh-CN': '登录',
  },
  methodsFailedDetail: {
    'en-US': 'Retry, or sign in with a password.',
    'zh-CN': '重试，或先用密码登录。',
  },
  methodsFailedTitle: {
    'en-US': 'Could not load sign-in methods',
    'zh-CN': '无法读取登录方式',
  },
  newPasswordLabel: {
    'en-US': 'New password',
    'zh-CN': '新密码',
  },
  noMethodsDetail: {
    'en-US':
      'Ask an administrator to enable a password, a passkey, or third-party sign-in.',
    'zh-CN': '联系管理员开通密码、通行密钥或第三方登录。',
  },
  noMethodsTitle: {
    'en-US': 'No sign-in method is available',
    'zh-CN': '没有可用的登录方式',
  },
  otherMethods: {
    'en-US': 'Other sign-in methods',
    'zh-CN': '其他登录方式',
  },
  passkeyFailedOnly: {
    'en-US': 'Try again.',
    'zh-CN': '再试一次。',
  },
  passkeyFailedPassword: {
    'en-US': 'Sign in with a password, or try again.',
    'zh-CN': '改用密码登录，或再试一次。',
  },
  passkeyFailedTitle: {
    'en-US': 'Passkey was not accepted',
    'zh-CN': '通行密钥未通过',
  },
  passkeyLabel: {
    'en-US': 'Passkey',
    'zh-CN': '通行密钥',
  },
  passkeyName: {
    'en-US': 'Sign in with a passkey',
    'zh-CN': '使用通行密钥登录',
  },
  passwordHint: {
    'en-US': 'At least 8 characters',
    'zh-CN': '至少 8 个字符',
  },
  passwordLabel: {
    'en-US': 'Password',
    'zh-CN': '密码',
  },
  passwordMismatch: {
    'en-US': 'The two passwords do not match. Enter the confirmation again.',
    'zh-CN': '两次密码不一致。重新填写确认密码。',
  },
  passwordRequired: {
    'en-US': 'Enter a password',
    'zh-CN': '填写密码',
  },
  passwordSet: {
    'en-US': 'New password is set',
    'zh-CN': '已设置新密码',
  },
  passwordTooShort: {
    'en-US': 'Password is shorter than 8 characters. Enter a longer one.',
    'zh-CN': '密码少于 8 个字符。重新填写。',
  },
  requestReset: {
    'en-US': 'Send reset link',
    'zh-CN': '发送重置链接',
  },
  resetPassword: {
    'en-US': 'Reset password',
    'zh-CN': '重置密码',
  },
  resetRequestDescription: {
    'en-US': 'Enter the account email. The reset link is sent to that address.',
    'zh-CN': '填写账号邮箱。重置链接发到该邮箱。',
  },
  resetSetDescription: {
    'en-US': 'Set a new password. Sign in after it is saved.',
    'zh-CN': '设置新密码。完成后前往登录。',
  },
  resetTitle: {
    'en-US': 'Reset password',
    'zh-CN': '重置密码',
  },
  retry: {
    'en-US': 'Retry',
    'zh-CN': '重试',
  },
  sendFailed: {
    'en-US': 'Could not send the reset link. Check the email and try again.',
    'zh-CN': '未能发送重置链接。检查邮箱后再试。',
  },
  sent: {
    'en-US':
      'If this email matches an account, the reset link was sent. Open it to set a new password.',
    'zh-CN': '若该邮箱对应账号，重置链接已发送。打开邮件中的链接设置新密码。',
  },
  setFailedDetail: {
    'en-US': 'Check it and try again, or request a new reset link.',
    'zh-CN': '检查后再试，或重新申请重置链接。',
  },
  setFailedTitle: {
    'en-US': 'Could not set the new password',
    'zh-CN': '未能设置新密码',
  },
  setPassword: {
    'en-US': 'Set new password',
    'zh-CN': '设置新密码',
  },
  signedIn: {
    'en-US': 'Signed in',
    'zh-CN': '已登录',
  },
  socialFailedOnly: {
    'en-US': 'Try again.',
    'zh-CN': '再试一次。',
  },
  socialFailedPassword: {
    'en-US': 'Sign in with a password, or try again.',
    'zh-CN': '改用密码登录，或再试一次。',
  },
  socialFailedTitle: {
    'en-US': 'Could not open {provider} sign-in',
    'zh-CN': '未能打开 {provider} 登录',
  },
  socialName: {
    'en-US': 'Sign in with {provider}',
    'zh-CN': '使用 {provider} 登录',
  },
  tokenInvalidDetail: {
    'en-US': 'Request a new reset link.',
    'zh-CN': '重新申请重置链接。',
  },
  tokenInvalidTitle: {
    'en-US': 'Reset link is invalid or expired',
    'zh-CN': '重置链接无效或已过期',
  },
  usernameLabel: {
    'en-US': 'Username',
    'zh-CN': '用户名',
  },
  usernameRequired: {
    'en-US': 'Enter a username',
    'zh-CN': '填写用户名',
  },
  usernameTaken: {
    'en-US': 'That username is taken. Choose another.',
    'zh-CN': '用户名已被占用。换一个用户名。',
  },
} as const

export const authCopy = createFeatureCopy(authCopyCatalog)

export type AuthCopyKey = Parameters<typeof authCopy>[1]
