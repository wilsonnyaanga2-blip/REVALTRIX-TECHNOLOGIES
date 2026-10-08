import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { ClinicalNotesService } from './clinical-notes.service.js';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto.js';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto.js';
import { AmendClinicalNoteDto } from './dto/amend-clinical-note.dto.js';
import { VoidClinicalNoteDto } from './dto/void-clinical-note.dto.js';

@Controller('v1/clinical-notes')
@UseGuards(AccessTokenGuard)
export class ClinicalNotesController {
  constructor(
    private readonly clinicalNotesService: ClinicalNotesService,
  ) {}

  @Get('encounter/:encounterId')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'read')
  async list(
    @Req() request: AuthenticatedRequest,
    @Param('encounterId') encounterId: string,
  ) {
    return this.clinicalNotesService.list(
      request.auth.userId,
      encounterId,
    );
  }

  @Get(':clinicalNoteId')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'read')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
  ) {
    return this.clinicalNotesService.getById(
      request.auth.userId,
      clinicalNoteId,
    );
  }

  @Get(':clinicalNoteId/versions')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'read')
  async getVersions(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
  ) {
    return this.clinicalNotesService.getVersions(
      request.auth.userId,
      clinicalNoteId,
    );
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'create')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateClinicalNoteDto,
  ) {
    return this.clinicalNotesService.create(
      request.auth.userId,
      dto,
    );
  }

  @Put(':clinicalNoteId')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'update')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
    @Body() dto: UpdateClinicalNoteDto,
  ) {
    return this.clinicalNotesService.update(
      request.auth.userId,
      clinicalNoteId,
      dto,
    );
  }

  @Post(':clinicalNoteId/sign')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'sign')
  async sign(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
  ) {
    return this.clinicalNotesService.sign(
      request.auth.userId,
      clinicalNoteId,
    );
  }

  @Post(':clinicalNoteId/finalize')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'finalize')
  async finalize(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
  ) {
    return this.clinicalNotesService.finalize(
      request.auth.userId,
      clinicalNoteId,
    );
  }

  @Post(':clinicalNoteId/amend')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'amend')
  async amend(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
    @Body() dto: AmendClinicalNoteDto,
  ) {
    return this.clinicalNotesService.amend(
      request.auth.userId,
      clinicalNoteId,
      dto,
    );
  }

  @Post(':clinicalNoteId/void')
  @UseGuards(PermissionGuard)
  @RequirePermission('clinical_notes', 'void')
  async void(
    @Req() request: AuthenticatedRequest,
    @Param('clinicalNoteId') clinicalNoteId: string,
    @Body() dto: VoidClinicalNoteDto,
  ) {
    return this.clinicalNotesService.void(
      request.auth.userId,
      clinicalNoteId,
      dto,
    );
  }
}
