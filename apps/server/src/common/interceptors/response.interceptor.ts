import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'
import type { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import {
  BYPASS_CASE_TRANSFORM_ROOT,
  transformResponseCase,
  withTaskIdAlias,
} from '~/common/response/case-transform'
import {
  isExplicitSuccessEnvelope,
  type SuccessEnvelope,
} from '~/common/response/envelope.types'
import {
  BYPASS_CASE_TRANSFORM_METADATA,
  RESPONSE_PASSTHROUGH_METADATA,
} from '~/constants/system.constant'
import { isHttpExecutionContext } from '~/transformers/get-req.transformer'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!isHttpExecutionContext(context)) {
      return next.handle()
    }

    const http = context.switchToHttp()
    const request = http.getRequest<FastifyRequest>()
    if (!request) {
      return next.handle()
    }

    const passthrough = this.reflector.getAllAndOverride<boolean>(
      RESPONSE_PASSTHROUGH_METADATA,
      [context.getClass(), context.getHandler()],
    )
    if (passthrough) {
      return next.handle()
    }

    const bypassMetadata = this.reflector.getAllAndOverride<string[]>(
      BYPASS_CASE_TRANSFORM_METADATA,
      [context.getHandler(), context.getClass()],
    )
    const bypassPaths = Array.isArray(bypassMetadata) ? bypassMetadata : []
    const wantsTaskIdAlias =
      request.method === 'POST' &&
      request.headers['user-agent']?.startsWith('mxs/')

    return next.handle().pipe(
      map((data) => {
        if (typeof data === 'undefined') {
          http.getResponse().status(204)
          return data
        }
        const envelope: SuccessEnvelope = isExplicitSuccessEnvelope(data)
          ? data
          : { data }
        const wireData = transformResponseCase(envelope.data, bypassPaths)
        const result: SuccessEnvelope = {
          data: wantsTaskIdAlias ? withTaskIdAlias(wireData) : wireData,
        }
        if (envelope.meta !== undefined) {
          result.meta = transformResponseCase(
            envelope.meta,
            bypassPaths.includes(BYPASS_CASE_TRANSFORM_ROOT)
              ? [BYPASS_CASE_TRANSFORM_ROOT]
              : [],
          ) as SuccessEnvelope['meta']
        }
        return result
      }),
    )
  }
}
