import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { QueuesModule } from '../queues/queues.module.js';
import { PatientJourneysController } from './patient-journeys.controller.js';
import { PatientJourneysService } from './patient-journeys.service.js';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule,
    QueuesModule,
  ],
  controllers: [PatientJourneysController],
  providers: [PatientJourneysService],
  exports: [PatientJourneysService],
})
export class PatientJourneysModule {}
