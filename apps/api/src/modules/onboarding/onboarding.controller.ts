import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import { UpdateTenantOnboardingDto } from './dto/update-tenant-onboarding.dto.js';
import { UpdatePatientOnboardingDto } from './dto/update-patient-onboarding.dto.js';
import { RegistrationSessionGuard } from '../registration/guards/registration-session.guard.js';
import type { RegistrationAuthenticatedRequest } from '../registration/guards/registration-session.guard.js';

@Controller('v1/onboarding')
@UseGuards(RegistrationSessionGuard)
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
  ) {}

  @Get('me')
  getMyOnboarding(
    @Req() request: RegistrationAuthenticatedRequest,
  ) {
    return this.onboardingService.getMyOnboarding(
      request.registrationAuth.userId,
    );
  }

  @Patch('tenant')
  patchTenantOnboarding(
    @Req() request: RegistrationAuthenticatedRequest,
    @Body() dto: UpdateTenantOnboardingDto,
  ) {
    return this.onboardingService.updateTenantOnboarding(
      request.registrationAuth.userId,
      dto,
    );
  }

  @Post('complete')
  completeOnboarding(
    @Req() request: RegistrationAuthenticatedRequest,
  ) {
    return this.onboardingService.completeOnboarding(
      request.registrationAuth.userId,
      request.registrationAuth.registrationSessionId,
    );
  }

  @Patch('patient')
  patchPatientOnboarding(
    @Req() request: RegistrationAuthenticatedRequest,
    @Body() dto: UpdatePatientOnboardingDto,
  ) {
    return this.onboardingService.updatePatientOnboarding(
      request.registrationAuth.userId,
      dto,
    );
  }
}
