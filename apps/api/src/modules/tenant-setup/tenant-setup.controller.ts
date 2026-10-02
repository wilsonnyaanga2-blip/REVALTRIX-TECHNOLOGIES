import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { TenantSetupService } from './tenant-setup.service.js';

@Controller('v1/tenant-setup')
@UseGuards(AccessTokenGuard)
export class TenantSetupController {
  constructor(
    private readonly tenantSetupService: TenantSetupService,
  ) {}

  @Get()
  async getSetup(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tenantSetupService.getSetup(request.auth.userId);
  }
}
