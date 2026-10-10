import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { FamilyAccessService } from './family-access.service.js';
import {
  REQUIRED_FAMILY_ACCESS_KEY,
  type RequiredFamilyAccess,
} from './require-family-access.decorator.js';

@Injectable()
export class FamilyAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly familyAccess: FamilyAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredFamilyAccess>(
      REQUIRED_FAMILY_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      throw new ForbiddenException('Family data permission is not configured for this endpoint');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const patientId = request.params.patientId;
    if (typeof patientId !== 'string' || !patientId) {
      throw new ForbiddenException('Patient identity is required for delegated access');
    }

    await this.familyAccess.assertPermission({
      delegateUserId: request.auth.userId,
      patientId,
      permission: required.permission,
      resourceType: required.resourceType,
      ...(required.action ? { action: required.action } : {}),
      ...(typeof request.params.resourceId === 'string'
        ? { resourceId: request.params.resourceId }
        : {}),
      request,
    });
    return true;
  }
}
