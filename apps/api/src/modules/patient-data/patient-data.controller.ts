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
  async deleteMyContact(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientDataService.deleteMyContact(
      request.auth.userId,
    );
  }
}
