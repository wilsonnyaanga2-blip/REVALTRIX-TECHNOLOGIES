import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticationService } from './authentication.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import type { AuthenticatedRequest } from './guards/access-token.guard.js';

@Controller('v1/core/authentication')
@UseGuards(ThrottlerGuard)
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authenticationService.login({
      identityType: dto.identityType,
      identifier: dto.identifier,
      password: dto.password,
      ...(dto.deviceId ? { deviceId: dto.deviceId } : {}),
    });
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authenticationService.refresh({
      sessionId: dto.sessionId,
      refreshToken: dto.refreshToken,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.authenticationService.logout(
      request.auth.sessionId,
    );
  }
}
