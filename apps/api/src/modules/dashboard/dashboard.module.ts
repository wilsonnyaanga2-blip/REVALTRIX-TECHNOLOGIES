import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { CoreModule } from '../core/core.module.js';
import { TenantSetupModule } from '../tenant-setup/tenant-setup.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, CoreModule, TenantSetupModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
