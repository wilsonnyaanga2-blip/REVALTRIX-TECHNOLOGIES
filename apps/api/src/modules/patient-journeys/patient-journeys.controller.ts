import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { CreateHandoffDto } from './dto/create-handoff.dto.js';
import { PatientJourneysService } from './patient-journeys.service.js';

@Controller('v1/patient-journeys')
@UseGuards(AccessTokenGuard)
export class PatientJourneysController {
  constructor(
    private readonly patientJourneysService: PatientJourneysService,
  ) {}

  @Post(':journeyId/handoffs')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async createHandoff(
    @Req() request: AuthenticatedRequest,
    @Param('journeyId') journeyId: string,
    @Body() dto: CreateHandoffDto,
  ) {
    return this.patientJourneysService.createHandoff(
      request.auth.userId,
      journeyId,
      dto,
    );
  }
}
