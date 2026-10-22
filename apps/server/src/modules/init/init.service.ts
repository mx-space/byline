import { Injectable } from '@nestjs/common'

import { DATA_DIR, TEMP_DIR } from '~/constants/path.constant'

import type { CreateFirstUserDto } from '../user/user.schema'
import { UserService } from '../user/user.service'

@Injectable()
export class InitService {
  constructor(private readonly userService: UserService) {}

  getTempdir() {
    return TEMP_DIR
  }

  getDatadir() {
    return DATA_DIR
  }

  isInit(): Promise<boolean> {
    return this.userService.hasAnyLoginUser()
  }

  createFirstUser(input: CreateFirstUserDto) {
    return this.userService.createFirstUser(input)
  }
}
