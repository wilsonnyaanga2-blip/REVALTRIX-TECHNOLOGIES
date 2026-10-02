import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';
import { RegistrationSessionGuard } from '../registration/guards/registration-session.guard.js';

@Module({
  imports: [AuthenticationModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    RegistrationSessionGuard,
  ],
})
export class OnboardingModule {}
