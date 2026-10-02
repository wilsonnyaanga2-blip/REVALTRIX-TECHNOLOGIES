import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard.js';
import type { AuthenticatedRequest } from '../authentication/guards/access-token.guard.js';

@Controller('v1/core/users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async getCurrentUser(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.findById(request.auth.userId);
  }
}
