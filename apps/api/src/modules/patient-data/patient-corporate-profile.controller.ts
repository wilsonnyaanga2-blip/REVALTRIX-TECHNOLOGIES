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
import { UpsertPatientCorporateProfileDto } from './dto/upsert-patient-corporate-profile.dto.js';
import { PatientCorporateProfileService } from './patient-corporate-profile.service.js';

@Controller('v1/patient-data/corporate-profile')
@UseGuards(AccessTokenGuard)
export class PatientCorporateProfileController {
  constructor(
    private readonly patientCorporateProfileService: PatientCorporateProfileService,
  ) {}

  @Get()
  async getMyCorporateProfile(@Req() request: AuthenticatedRequest) {
    return this.patientCorporateProfileService.getMyCorporateProfile(
      request.auth.userId,
    );
  }

  @Put()
  async upsert(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertPatientCorporateProfileDto,
  ) {
    return this.patientCorporateProfileService.upsertCorporateProfile(
      request.auth.userId,
      dto,
    );
  }

  @Delete()
  async remove(@Req() request: AuthenticatedRequest) {
    return this.patientCorporateProfileService.deleteCorporateProfile(
      request.auth.userId,
    );
  }
}
