import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { PatientFamilyController } from './patient-family.controller.js';
import { PatientFamilyService } from './patient-family.service.js';

@Module({
  imports: [AuthenticationModule],
  controllers: [PatientFamilyController],
  providers: [PatientFamilyService],
  exports: [PatientFamilyService],
})
export class PatientFamilyModule {}
