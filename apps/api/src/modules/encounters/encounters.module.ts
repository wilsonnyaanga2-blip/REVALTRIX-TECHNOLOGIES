import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { QueuesModule } from '../queues/queues.module.js';
import { EncountersController } from './encounters.controller.js';
import { EncountersService } from './encounters.service.js';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule,
    QueuesModule,
  ],
  controllers: [EncountersController],
  providers: [EncountersService],
  exports: [EncountersService],
})
export class EncountersModule {}
