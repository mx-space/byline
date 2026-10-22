import { createHash, randomBytes } from 'node:crypto'

import { Injectable, Logger } from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'
import { ConfigsService } from '~/modules/configs/configs.service'
import {
  EmailService,
  EmailTemplateType,
} from '~/processors/helper/helper.email.service'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import type { AcceptInviteDto, CreateInviteDto } from './user.schema'
import { UserService } from './user.service'
import type { UserInviteRow } from './user.types'
import { UserViews } from './user.views'
import { UserInviteRepository } from './user-invite.repository'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const hashInviteToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

@Injectable()
export class UserInviteService {
  private readonly logger = new Logger(UserInviteService.name)

  constructor(
    private readonly inviteRepository: UserInviteRepository,
    private readonly userService: UserService,
    private readonly configsService: ConfigsService,
    private readonly emailService: EmailService,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  toView(row: UserInviteRow) {
    return UserViews.invite.parse(row)
  }

  async buildAcceptUrl(token: string) {
    const { adminUrl } = await this.configsService.get('url')
    const base = (adminUrl || '').replace(/\/+$/, '')
    return `${base}/#/invite/${encodeURIComponent(token)}`
  }

  async list() {
    const rows = await this.inviteRepository.listPending()
    return rows.map((row) => this.toView(row))
  }

  async create(dto: CreateInviteDto, inviter: { id: string; name?: string }) {
    const email = dto.email.trim().toLowerCase()
    if (await this.userService.hasUserWithEmail(email)) {
      throw createAppException(AppErrorCode.USER_CONFLICT)
    }
    await this.inviteRepository.deletePendingByEmail(email)

    const token = randomBytes(32).toString('base64url')
    const row = await this.inviteRepository.create({
      id: this.snowflakeService.nextId(),
      email,
      displayName: dto.displayName ?? null,
      tokenHash: hashInviteToken(token),
      invitedBy: inviter.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    const acceptUrl = await this.buildAcceptUrl(token)
    const emailQueued = await this.queueInviteEmail(row, acceptUrl, inviter)

    return UserViews.createdInvite.parse({
      ...row,
      token,
      acceptUrl,
      emailQueued,
    })
  }

  private async queueInviteEmail(
    invite: UserInviteRow,
    acceptUrl: string,
    inviter: { name?: string },
  ) {
    const { enable } = await this.configsService.get('mailOptions')
    if (!enable || !(await this.emailService.checkIsReady())) return false
    this.emailService
      .sendTemplate(EmailTemplateType.Invite, {
        to: invite.email,
        subject: 'You have been invited to Byline',
        props: {
          siteName: 'Byline',
          inviterName: inviter.name || 'A teammate',
          displayName: invite.displayName,
          email: invite.email,
          acceptUrl,
          expiresAt: invite.expiresAt.toUTCString(),
        },
      })
      .catch((error: Error) => {
        this.logger.warn(`Failed to send invite email: ${error.message}`)
      })
    return true
  }

  async revoke(id: string) {
    const invite = await this.inviteRepository.findById(id)
    if (!invite) throw createAppException(AppErrorCode.INVITE_NOT_FOUND)
    if (invite.acceptedAt) {
      throw createAppException(AppErrorCode.INVITE_ALREADY_ACCEPTED)
    }
    await this.inviteRepository.deleteById(id)
  }

  private async findUsable(token: string) {
    const invite = await this.inviteRepository.findByTokenHash(
      hashInviteToken(token),
    )
    if (!invite) throw createAppException(AppErrorCode.INVITE_NOT_FOUND)
    if (invite.acceptedAt) {
      throw createAppException(AppErrorCode.INVITE_ALREADY_ACCEPTED)
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw createAppException(AppErrorCode.INVITE_EXPIRED)
    }
    return invite
  }

  async getPublic(token: string) {
    const invite = await this.findUsable(token)
    return UserViews.publicInvite.parse(invite)
  }

  async accept(token: string, dto: AcceptInviteDto) {
    const invite = await this.findUsable(token)
    const created = await this.userService.createWithPassword({
      user: {
        email: invite.email,
        emailVerified: true,
        username: dto.username,
        displayName: dto.displayName || invite.displayName || dto.username,
      },
      password: dto.password,
      claimInviteId: invite.id,
    })
    if (!created) {
      throw createAppException(AppErrorCode.INVITE_ALREADY_ACCEPTED)
    }
    return this.userService.toDetail(created)
  }
}
