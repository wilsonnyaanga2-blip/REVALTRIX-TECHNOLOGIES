import { Module } from '@nestjs/common';
import { PatientDataController } from './patient-data.controller.js';
import { PatientDataService } from './patient-data.service.js';
import { EmergencyContactsController } from './emergency-contacts.controller.js';
import { EmergencyContactsService } from './emergency-contacts.service.js';
import { NextOfKinController } from './next-of-kin.controller.js';
import { NextOfKinService } from './next-of-kin.service.js';
import { PatientAddressesController } from './patient-addresses.controller.js';
import { PatientAddressesService } from './patient-addresses.service.js';
import { PatientInsurancesController } from './patient-insurances.controller.js';
import { PatientInsurancesService } from './patient-insurances.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { PatientCorporateProfileController } from './patient-corporate-profile.controller.js';
import { PatientCorporateProfileService } from './patient-corporate-profile.service.js';

@Module({
  imports: [AuthenticationModule],
  controllers: [PatientCorporateProfileController, PatientDataController, EmergencyContactsController, NextOfKinController, PatientAddressesController, PatientInsurancesController],
  providers: [PatientCorporateProfileService, PatientDataService, EmergencyContactsService, NextOfKinService, PatientAddressesService, PatientInsurancesService],
  exports: [PatientDataService],
})
export class PatientDataModule {}
