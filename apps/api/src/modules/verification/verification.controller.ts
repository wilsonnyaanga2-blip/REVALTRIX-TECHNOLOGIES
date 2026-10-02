import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VerificationService } from './verification.service.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyCodeDto } from './dto/verify-code.dto.js';
import { RegistrationSessionGuard } from '../registration/guards/registration-session.guard.js';
import type { RegistrationAuthenticatedRequest } from '../registration/guards/registration-session.guard.js';

@Controller('v1/verification')
@UseGuards(RegistrationSessionGuard)
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
  ) {}

  @Post('registration/request')
  requestRegistrationVerification(
    @Req() request: RegistrationAuthenticatedRequest,
    @Body() dto: RequestVerificationDto,
  ) {
    return this.verificationService.createRegistrationVerification(
      request.registrationAuth.userId,
      dto.channel,
    );
  }

  @Post('registration/verify')
  verifyRegistrationCode(
    @Req() request: RegistrationAuthenticatedRequest,
    @Body() dto: VerifyCodeDto,
  ) {
    return this.verificationService.verifyRegistrationCode(
      request.registrationAuth.userId,
      dto.challengeId,
      dto.code,
    );
  }
}
