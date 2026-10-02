import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';
import { ProviderQueryDto } from './dto/provider-query.dto.js';
import { UpdateProviderDto } from './dto/update-provider.dto.js';
import { ProvidersService } from './providers.service.js';

@Controller('v1/providers')
@UseGuards(AccessTokenGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('providers', 'read')
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ProviderQueryDto,
  ) {
    return this.providersService.list(request.auth.userId, query);
  }

  @Get(':providerId')
  @UseGuards(PermissionGuard)
  @RequirePermission('providers', 'read')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('providerId') providerId: string,
  ) {
    return this.providersService.getById(
      request.auth.userId,
      providerId,
    );
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('providers', 'create')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateProviderDto,
  ) {
    return this.providersService.create(
      request.auth.userId,
      dto,
    );
  }

  @Patch(':providerId')
  @UseGuards(PermissionGuard)
  @RequirePermission('providers', 'update')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('providerId') providerId: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providersService.update(
      request.auth.userId,
      providerId,
      dto,
    );
  }

  @Delete(':providerId')
  @UseGuards(PermissionGuard)
  @RequirePermission('providers', 'delete')
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('providerId') providerId: string,
  ) {
    return this.providersService.remove(
      request.auth.userId,
      providerId,
    );
  }
}
