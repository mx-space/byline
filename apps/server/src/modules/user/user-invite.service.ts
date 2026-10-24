import { createHash, randomBytes } from 'node:crypto'

import { Injectable, Logger } from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'
import { PERMISSION_PRESETS } from '~/constants/permission.constant'
import { ConfigsService } from '~/modules/configs/configs.service'
import {
  EmailService,
  EmailTemplateType,
} from '~/processors/helper/helper.email.service'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import type {
  AcceptInviteDto,
  CreateInviteDto,
  InviteExistingUserDto,
} from './user.schema'
import { UserService } from './user.service'
import type { UserInviteRow, UserRow } from './user.types'
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
    const existing = await this.userService.findByEmail(email)
    if (existing) this.assertInvitable(existing)
    return this.issue(
      {
        email,
        displayName: dto.displayName ?? existing?.displayName ?? null,
        userId: existing?.id ?? null,
        permissions: dto.permissions ?? null,
      },
      inviter,
    )
  }

  async inviteExisting(
    userId: string,
    dto: InviteExistingUserDto,
    inviter: { id: string; name?: string },
  ) {
    const user = await this.userService.findById(userId)
    if (!user) {
      throw createAppException(AppErrorCode.USER_NOT_FOUND, { id: userId })
    }
    this.assertInvitable(user)
    const email = (dto.email ?? user.email)?.trim().toLowerCase()
    if (!email) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'An email is required to invite this author',
      })
    }
    const owner = await this.userService.findByEmail(email)
    if (owner && owner.id !== user.id) {
      throw createAppException(AppErrorCode.USER_CONFLICT)
    }
    return this.issue(
      {
        email,
        displayName: dto.displayName ?? user.displayName,
        userId: user.id,
        permissions: dto.permissions ?? null,
      },
      inviter,
    )
  }

  private assertInvitable(user: UserRow) {
    if (!user.isProfileOnly) {
      throw createAppException(AppErrorCode.USER_CONFLICT)
    }
    if (user.deactivatedAt) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'Reactivate this author before inviting them',
      })
    }
  }

  private async issue(
    target: {
      email: string
      displayName: string | null
      userId: string | null
      permissions: number | null
    },
    inviter: { id: string; name?: string },
  ) {
    await this.inviteRepository.deletePendingByEmail(target.email)
    if (target.userId) {
      await this.inviteRepository.deletePendingByUserId(target.userId)
    }

    const token = randomBytes(32).toString('base64url')
    const row = await this.inviteRepository.create({
      id: this.snowflakeService.nextId(),
      email: target.email,
      displayName: target.displayName,
      tokenHash: hashInviteToken(token),
      invitedBy: inviter.id,
      userId: target.userId,
      permissions: target.permissions,
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
    const permissions = invite.permissions ?? PERMISSION_PRESETS.author
    if (invite.userId) {
      const converted = await this.userService.convertProfileOnly({
        userId: invite.userId,
        email: invite.email,
        username: dto.username,
        displayName: dto.displayName,
        password: dto.password,
        permissions,
        claimInviteId: invite.id,
      })
      return this.userService.toDetail(converted)
    }
    const created = await this.userService.createWithPassword({
      user: {
        email: invite.email,
        emailVerified: true,
        username: dto.username,
        displayName: dto.displayName || invite.displayName || dto.username,
        permissions,
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
