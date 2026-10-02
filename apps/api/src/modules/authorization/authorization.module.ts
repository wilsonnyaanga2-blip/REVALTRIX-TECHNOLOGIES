import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { AuthorizationService } from './authorization.service.js';
import { PermissionGuard } from './guards/permission.guard.js';

@Module({
  imports: [AuthenticationModule],
  providers: [
    AuthorizationService,
    PermissionGuard,
  ],
  exports: [
    AuthorizationService,
    PermissionGuard,
  ],
})
export class AuthorizationModule {}
