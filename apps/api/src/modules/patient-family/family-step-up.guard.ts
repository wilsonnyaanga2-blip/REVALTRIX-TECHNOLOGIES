import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { FamilyAccessService } from './family-access.service.js';
import { REQUIRE_FAMILY_STEP_UP } from './require-family-step-up.decorator.js';

@Injectable()
export class FamilyStepUpGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly familyAccess: FamilyAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_FAMILY_STEP_UP, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) {
      throw new ForbiddenException('Step-up verification is not configured');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const value = request.headers['x-step-up-challenge-id'];
    const challengeId = Array.isArray(value) ? value[0] : value;
    await this.familyAccess.consumeStepUp(request.auth.userId, request.auth.sessionId, challengeId);
    return true;
  }
}
