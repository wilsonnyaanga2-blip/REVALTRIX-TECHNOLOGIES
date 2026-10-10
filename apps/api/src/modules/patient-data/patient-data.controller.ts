import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { PatientDataService } from './patient-data.service.js';
import { UpsertPatientContactDto } from './dto/upsert-patient-contact.dto.js';
import { FamilyStepUpGuard } from '../patient-family/family-step-up.guard.js';
import { RequireFamilyStepUp } from '../patient-family/require-family-step-up.decorator.js';

@Controller('v1/patient-data')
@UseGuards(AccessTokenGuard)
export class PatientDataController {
  constructor(
    private readonly patientDataService: PatientDataService,
  ) {}

  @Get('contact')
  async getMyContact(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientDataService.getMyContact(
      request.auth.userId,
    );
  }

  @Put('contact')
  @UseGuards(FamilyStepUpGuard)
  @RequireFamilyStepUp()
  async upsertMyContact(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertPatientContactDto,
  ) {
    return this.patientDataService.upsertMyContact(
      request.auth.userId,
      dto,
    );
  }

  @Delete('contact')
  @UseGuards(FamilyStepUpGuard)
  @RequireFamilyStepUp()
  async deleteMyContact(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientDataService.deleteMyContact(
      request.auth.userId,
    );
  }
}
