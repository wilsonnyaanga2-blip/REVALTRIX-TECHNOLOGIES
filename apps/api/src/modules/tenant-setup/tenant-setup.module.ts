import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { CoreModule } from '../core/core.module.js';
import { TenantSetupController } from './tenant-setup.controller.js';
import { TenantSetupService } from './tenant-setup.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, CoreModule],
  controllers: [TenantSetupController],
  providers: [TenantSetupService],
  exports: [TenantSetupService],
})
export class TenantSetupModule {}
