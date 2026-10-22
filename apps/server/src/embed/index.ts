import inviteEmail from './email-template/invite.template.ejs?raw'
import passwordResetEmail from './email-template/password-reset.template.ejs?raw'
import renderDevice from './render/device.ejs?raw'

export const EMBED_FILES: Record<string, string> = {
  '/render/device.ejs': renderDevice,
  '/email-template/invite.template.ejs': inviteEmail,
  '/email-template/password-reset.template.ejs': passwordResetEmail,
}
