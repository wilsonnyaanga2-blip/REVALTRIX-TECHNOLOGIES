import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { AuthorizationService } from './authorization.service.js';
import { PermissionGuard } from './guards/permission.guard.js';
import { PlatformPermissionGuard } from './guards/platform-permission.guard.js';

@Module({
  imports: [AuthenticationModule],
  providers: [
    AuthorizationService,
    PermissionGuard,
    PlatformPermissionGuard,
  ],
  exports: [
    AuthorizationService,
    PermissionGuard,
    PlatformPermissionGuard,
  ],
})
export class AuthorizationModule {}