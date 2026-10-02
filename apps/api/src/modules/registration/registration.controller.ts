import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { RegistrationService } from './registration.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { RegisterPatientDto } from './dto/register-patient.dto.js';

@Controller('v1/registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
  ) {}

  @Post('tenants')
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.registrationService.registerTenant(dto);
  }

  @Post('patients')
  registerPatient(@Body() dto: RegisterPatientDto) {
    return this.registrationService.registerPatient(dto);
  }
}
