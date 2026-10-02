import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { PatientsController } from './patients.controller.js';
import { PatientsService } from './patients.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { VerificationModule } from '../verification/verification.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, VerificationModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
