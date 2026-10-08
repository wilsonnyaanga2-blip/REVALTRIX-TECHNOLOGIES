import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { QueuesController } from './queues.controller.js';
import { QueuesService } from './queues.service.js';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule,
  ],
  controllers: [QueuesController],
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {}
