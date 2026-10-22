import { applyDecorators, UseGuards } from '@nestjs/common'

import { AuthTestingGuard } from '../guard/auth.guard'

export function Auth() {
  return applyDecorators(UseGuards(AuthTestingGuard))
}
