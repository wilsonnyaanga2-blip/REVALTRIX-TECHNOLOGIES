import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegistrationDashboardService } from './registration-dashboard.service.js';
import { RegistrationSessionGuard } from '../registration/guards/registration-session.guard.js';
import type { RegistrationAuthenticatedRequest } from '../registration/guards/registration-session.guard.js';

@Controller('v1/registration-dashboard')
@UseGuards(RegistrationSessionGuard)
export class RegistrationDashboardController {
  constructor(
    private readonly registrationDashboardService: RegistrationDashboardService,
  ) {}

  @Get()
  getDashboard(
    @Req() request: RegistrationAuthenticatedRequest,
  ) {
    return this.registrationDashboardService.getDashboard(
      request.registrationAuth.userId,
    );
  }
}
