import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../core/authentication/guards/access-token.guard.js';
import { AuthorizationService } from '../authorization.service.js';
import { REQUIRED_PLATFORM_PERMISSION_KEY } from '../decorators/require-platform-permission.decorator.js';
import type { RequiredPermission } from '../types/authorization.types.js';

@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<RequiredPermission>(
        REQUIRED_PLATFORM_PERMISSION_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!required) {
      throw new ForbiddenException(
        'Platform authorization permission is not configured for this endpoint',
      );
    }

    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.auth?.userId) {
      throw new ForbiddenException(
        'Authenticated user context is required',
      );
    }

    await this.authorizationService.assertPlatformPermission(
      request.auth.userId,
      required,
    );

    return true;
  }
}
