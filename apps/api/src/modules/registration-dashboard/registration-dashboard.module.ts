import { Module } from '@nestjs/common';
import { RegistrationDashboardController } from './registration-dashboard.controller.js';
import { RegistrationDashboardService } from './registration-dashboard.service.js';
import { RegistrationSessionGuard } from '../registration/guards/registration-session.guard.js';

@Module({
  controllers: [RegistrationDashboardController],
  providers: [
    RegistrationDashboardService,
    RegistrationSessionGuard,
  ],
})
export class RegistrationDashboardModule {}
