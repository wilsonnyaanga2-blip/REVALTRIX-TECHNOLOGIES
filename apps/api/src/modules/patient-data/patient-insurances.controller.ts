import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { CreatePatientInsuranceDto } from './dto/create-patient-insurance.dto.js';
import { UpdatePatientInsuranceDto } from './dto/update-patient-insurance.dto.js';
import { PatientInsurancesService } from './patient-insurances.service.js';

@Controller('v1/patient-data/insurance')
@UseGuards(AccessTokenGuard)
export class PatientInsurancesController {
  constructor(
    private readonly patientInsurancesService: PatientInsurancesService,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.patientInsurancesService.listMyInsurance(
      request.auth.userId,
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePatientInsuranceDto,
  ) {
    return this.patientInsurancesService.createMyInsurance(
      request.auth.userId,
      dto,
    );
  }

  @Put(':insuranceId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('insuranceId') insuranceId: string,
    @Body() dto: UpdatePatientInsuranceDto,
  ) {
    return this.patientInsurancesService.updateMyInsurance(
      request.auth.userId,
      insuranceId,
      dto,
    );
  }

  @Delete(':insuranceId')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('insuranceId') insuranceId: string,
  ) {
    return this.patientInsurancesService.deleteMyInsurance(
      request.auth.userId,
      insuranceId,
    );
  }
}
