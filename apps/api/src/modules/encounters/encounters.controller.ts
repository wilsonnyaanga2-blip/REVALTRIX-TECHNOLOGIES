import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { CreateEncounterDto } from './dto/create-encounter.dto.js';
import { EncounterQueryDto } from './dto/encounter-query.dto.js';
import { TransitionEncounterDto } from './dto/transition-encounter.dto.js';
import { EncountersService } from './encounters.service.js';

@Controller('v1/encounters')
@UseGuards(AccessTokenGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'read')
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: EncounterQueryDto,
  ) {
    return this.encountersService.list(
      request.auth.userId,
      query,
    );
  }

  @Post(':encounterId/check-in')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async checkIn(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encountersService.checkIn(
      request.auth.userId,
      encounterId,
    );
  }

  @Post(':encounterId/triage')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async triage(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encountersService.triage(
      request.auth.userId,
      encounterId,
    );
  }

  @Post(':encounterId/start')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async start(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encountersService.start(
      request.auth.userId,
      encounterId,
    );
  }

  @Post(':encounterId/complete')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async complete(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encountersService.complete(
      request.auth.userId,
      encounterId,
    );
  }

  @Post(':encounterId/cancel')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async cancel(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
    @Body() dto: TransitionEncounterDto,
  ) {
    return this.encountersService.cancel(
      request.auth.userId,
      encounterId,
      dto,
    );
  }

  @Post(':encounterId/no-show')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async noShow(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
    @Body() dto: TransitionEncounterDto,
  ) {
    return this.encountersService.noShow(
      request.auth.userId,
      encounterId,
      dto,
    );
  }

  @Post(':encounterId/refer')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'update')
  async refer(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
    @Body() dto: TransitionEncounterDto,
  ) {
    return this.encountersService.refer(
      request.auth.userId,
      encounterId,
      dto,
    );
  }

  @Get(':encounterId/history')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'read')
  async getHistory(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encountersService.getHistory(
      request.auth.userId,
      encounterId,
    );
  }

  @Get(':encounterId')
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'read')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encountersService.getById(
      request.auth.userId,
      encounterId,
    );
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('encounters', 'create')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateEncounterDto,
  ) {
    return this.encountersService.create(
      request.auth.userId,
      dto,
    );
  }
}
