import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { CoreModule } from '../core/core.module.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, CoreModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
