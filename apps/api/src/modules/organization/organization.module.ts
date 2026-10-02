import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { CoreModule } from '../core/core.module.js';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, CoreModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
