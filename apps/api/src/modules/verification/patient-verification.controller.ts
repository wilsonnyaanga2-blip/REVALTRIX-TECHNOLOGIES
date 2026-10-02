import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  Throttle,
  ThrottlerGuard,
} from '@nestjs/throttler';
import { VerificationService } from './verification.service.js';
import { VerifyPatientRegistrationDto } from './dto/verify-patient-registration.dto.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { AuthorizationService } from '../authorization/authorization.service.js';

@Controller('v1/verification/patient-registration')
@UseGuards(ThrottlerGuard)
export class PatientVerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post('verify')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  verify(
    @Body() dto: VerifyPatientRegistrationDto,
  ) {
    return this.verificationService.verifyPatientRegistrationCode(
      dto.challengeId,
      dto.code,
    );
  }

  @Post('staff/verify')
  @UseGuards(AccessTokenGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async staffVerify(
    @Req() request: AuthenticatedRequest,
    @Body() dto: VerifyPatientRegistrationDto,
  ) {
    const context = await this.authorizationService.getContext(
      request.auth.userId,
    );

    return this.verificationService.verifyPatientRegistrationCode(
      dto.challengeId,
      dto.code,
      request.auth.userId,
      context.tenantId,
    );
  }
}
