import { Controller, Get, Param } from '@nestjs/common';
import { IdentityService } from './identity.service.js';

@Controller('v1/core/identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('users/:userId')
  findUser(@Param('userId') userId: string) {
    return this.identityService.findUserById(userId);
  }
}
