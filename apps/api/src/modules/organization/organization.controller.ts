import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { OrganizationService } from './organization.service.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Controller('v1/organization')
@UseGuards(AccessTokenGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('organization', 'read')
  getOrganization(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.organizationService.getOrganization(
      request.auth.userId,
    );
  }

  @Patch()
  @UseGuards(PermissionGuard)
  @RequirePermission('organization', 'update')
  updateOrganization(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.updateOrganization(
      request.auth.userId,
      dto,
    );
  }
}
