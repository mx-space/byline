import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { OpId } from 'loro-crdt'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { CurrentUser } from '~/common/decorators/current-user.decorator'
import { WithFastifyRouteOptions } from '~/common/decorators/fastify-route-options.decorator'
import { HTTPDecorators } from '~/common/decorators/http.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { withMeta } from '~/common/response/envelope.types'
import { MetaObjectBuilder } from '~/common/response/meta-builder'
import { UserPermission } from '~/constants/permission.constant'
import type { SessionUser } from '~/modules/auth/auth.types'
import { type EntityIdDto, EntityIdSchema } from '~/shared/dto/id.dto'

import { DraftRefType } from './draft.enum'
import {
  type CreateDraftDto,
  CreateDraftSchema,
  type DraftCheckpointDto,
  DraftCheckpointSchema,
  type DraftCrdtQueryDto,
  DraftCrdtQuerySchema,
  type DraftDocumentIdDto,
  DraftDocumentIdSchema,
  type DraftFieldsDto,
  DraftFieldsSchema,
  type DraftPagerDto,
  DraftPagerSchema,
  type DraftRefTypeAndIdDto,
  DraftRefTypeAndIdSchema,
  type DraftRefTypeDto,
  DraftRefTypeSchema,
  type DraftRestoreDto,
  DraftRestoreSchema,
  type DraftShareTokenDto,
  DraftShareTokenSchema,
  type DraftUndoDto,
  DraftUndoSchema,
  type DraftWorkingCopyParamsDto,
  DraftWorkingCopyParamsSchema,
  type RevisionComparisonDto,
  RevisionComparisonSchema,
  type SetDraftShareDto,
  SetDraftShareSchema,
  type UpdateDraftDto,
  UpdateDraftSchema,
} from './draft.schema'
import { DraftService } from './draft.service'
import { DraftViews } from './draft.views'

const CRDT_UPDATE_BODY_LIMIT = 4 * 1024 * 1024

@ApiController('drafts')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Post('/')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  create(
    @CurrentUser() user: SessionUser,
    @Body({ schema: CreateDraftSchema }) body: CreateDraftDto,
  ) {
    return this.draftService.create(body, user)
  }

  @Get('/')
  @Auth()
  async list(@Query({ schema: DraftPagerSchema }) query: DraftPagerDto) {
    const result = await this.draftService.list(query.page, query.size, {
      hasRef: query.hasRef,
      refType: query.refType,
      search: query.search,
    })
    return withMeta(
      result.data,
      new MetaObjectBuilder()
        .view('card')
        .pagination({
          page: result.pagination.currentPage,
          size: result.pagination.size,
          total: result.pagination.total,
          totalPages: result.pagination.totalPage,
        })
        .build(),
    )
  }

  @Get('/context/:refType/:refId')
  @Auth()
  context(
    @Param({ schema: DraftRefTypeAndIdSchema }) params: DraftRefTypeAndIdDto,
  ) {
    return this.draftService.getContext(
      params.refType as DraftRefType,
      params.refId,
    )
  }

  @Post('/working-copy/:refType/:refId')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  openWorkingCopy(
    @CurrentUser() user: SessionUser,
    @Param({ schema: DraftWorkingCopyParamsSchema })
    params: DraftWorkingCopyParamsDto,
  ) {
    return this.draftService.openWorkingCopy(
      params.refType as DraftRefType,
      params.refId,
      user,
    )
  }

  @Get('/new/:refType')
  @Auth()
  getNewDrafts(@Param({ schema: DraftRefTypeSchema }) params: DraftRefTypeDto) {
    return this.draftService.findNewDrafts(params.refType as DraftRefType)
  }

  @Get('/shared/:token')
  async shared(
    @Param({ schema: DraftShareTokenSchema }) params: DraftShareTokenDto,
  ) {
    const snapshot = await this.draftService.findSharedSnapshot(params.token)
    return DraftViews.shared.parse(snapshot)
  }

  @Get('/documents/:documentId/share')
  @Auth()
  getShare(
    @Param({ schema: DraftDocumentIdSchema }) params: DraftDocumentIdDto,
  ) {
    return this.draftService.getShare(params.documentId)
  }

  @Put('/documents/:documentId/share')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  setShare(
    @CurrentUser() user: SessionUser,
    @Param({ schema: DraftDocumentIdSchema }) params: DraftDocumentIdDto,
    @Body({ schema: SetDraftShareSchema }) body: SetDraftShareDto,
  ) {
    return this.draftService.setShare(params.documentId, body, user)
  }

  @Delete('/documents/:documentId/share')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  async deleteShare(
    @CurrentUser() user: SessionUser,
    @Param({ schema: DraftDocumentIdSchema }) params: DraftDocumentIdDto,
  ) {
    await this.draftService.deleteShare(params.documentId, user)
    return { success: true }
  }

  @Get('/compare/:leftId/:rightId')
  @Auth()
  compare(
    @Param({ schema: RevisionComparisonSchema }) params: RevisionComparisonDto,
  ) {
    return this.draftService.compare(params.leftId, params.rightId)
  }

  @Get('/revisions/:id')
  @Auth()
  revision(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    return this.draftService.findRevisionById(params.id)
  }

  @Get('/:id')
  @Auth()
  async getById(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    const draft = await this.draftService.findById(params.id)
    if (!draft) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id: params.id })
    }
    return draft
  }

  @Get('/:id/revisions')
  @Auth()
  revisions(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    return this.draftService.getBranchRevisions(params.id)
  }

  @Get('/:id/crdt')
  @Auth()
  @HTTPDecorators.RawResponse
  async exportCrdt(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Query({ schema: DraftCrdtQuerySchema }) query: DraftCrdtQueryDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const bytes = await this.draftService.exportCrdt(
      params.id,
      user,
      query.since
        ? new Uint8Array(Buffer.from(query.since, 'base64'))
        : undefined,
    )
    reply.type('application/octet-stream')
    return Buffer.from(bytes)
  }

  @Post('/:id/crdt')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  @HttpCode(204)
  @WithFastifyRouteOptions({ bodyLimit: CRDT_UPDATE_BODY_LIMIT })
  async importCrdt(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Req() request: FastifyRequest,
  ) {
    if (!Buffer.isBuffer(request.body)) {
      throw createAppException(AppErrorCode.DRAFT_CRDT_UPDATE_REJECTED, {
        branchId: params.id,
        reason: 'expected an application/octet-stream body',
      })
    }
    await this.draftService.importCrdt(
      params.id,
      new Uint8Array(request.body),
      user,
    )
  }

  @Post('/:id/checkpoints')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  createCheckpoint(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: DraftCheckpointSchema }) body: DraftCheckpointDto,
  ) {
    return this.draftService.createCheckpoint(params.id, body.kind, user)
  }

  @Patch('/:id/fields')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  updateFields(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: DraftFieldsSchema }) body: DraftFieldsDto,
  ) {
    return this.draftService.updateFields(params.id, body, user)
  }

  @Get('/:id/history')
  @Auth()
  history(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
  ) {
    return this.draftService.history(params.id, user)
  }

  @Get('/:id/archived')
  @Auth()
  archived(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
  ) {
    return this.draftService.archivedDrafts(params.id, user)
  }

  @Post('/:id/restore')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  restore(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: DraftRestoreSchema }) body: DraftRestoreDto,
  ) {
    return this.draftService.restore(params.id, body.revisionId, user)
  }

  @Post('/:id/undo')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  undo(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: DraftUndoSchema }) body: DraftUndoDto,
  ) {
    return this.draftService.undo(
      params.id,
      body.id as OpId,
      body.before as OpId[],
      user,
    )
  }

  @Put('/:id')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  update(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: UpdateDraftSchema }) body: UpdateDraftDto,
  ) {
    return this.draftService.update(params.id, body, user)
  }

  @Delete('/:id')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  async delete(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
  ) {
    await this.draftService.delete(params.id, user)
    return { success: true }
  }
}
