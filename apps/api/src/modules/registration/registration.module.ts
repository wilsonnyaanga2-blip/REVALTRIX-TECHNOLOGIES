import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { RegistrationController } from './registration.controller.js';
import { RegistrationService } from './registration.service.js';
import { RegistrationPasswordController } from './registration-password.controller.js';
import { RegistrationPasswordService } from './registration-password.service.js';

@Module({
  imports: [AuthenticationModule],
  controllers: [
    RegistrationController,
    RegistrationPasswordController,
  ],
  providers: [
    RegistrationService,
    RegistrationPasswordService,
  ],
  exports: [
    RegistrationService,
  ],
})
export class RegistrationModule {}
