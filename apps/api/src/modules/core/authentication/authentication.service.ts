import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IdentityType } from '@prisma/client';
import { CredentialService } from './credential.service.js';
import { SessionService } from '../sessions/session.service.js';
import { TokenService } from './token.service.js';

export interface LoginRequest {
  identityType: IdentityType;
  identifier: string;
  password: string;
  deviceId?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
  userId: string;
}

export interface RefreshTokenRequest {
  sessionId: string;
  refreshToken: string;
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly credentialService: CredentialService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  async createAuthenticatedSession(
    transaction: Prisma.TransactionClient,
    userId: string,
  ) {
    const session = await this.sessionService.createSessionInTransaction(
      transaction,
      userId,
    );

    return {
      accessToken: await this.tokenService.createAccessToken(
        userId,
        session.sessionId,
      ),
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      userId,
    } satisfies LoginResult;
  }

  async login(request: LoginRequest): Promise<LoginResult> {
    const credentials =
      await this.credentialService.verifyCredentials(
        request.identityType,
        request.identifier,
        request.password,
      );

    const session = await this.sessionService.createSession(
      credentials.userId,
      request.deviceId,
    );

    const accessToken =
      await this.tokenService.createAccessToken(
        credentials.userId,
        session.sessionId,
      );

    return {
      accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      userId: credentials.userId,
    };
  }

  async refresh(
    request: RefreshTokenRequest,
  ): Promise<LoginResult> {
    if (!request.sessionId || !request.refreshToken) {
      throw new UnauthorizedException('Invalid refresh request');
    }

    const session =
      await this.sessionService.rotateRefreshToken(
        request.sessionId,
        request.refreshToken,
      );

    const accessToken =
      await this.tokenService.createAccessToken(
        session.userId,
        session.sessionId,
      );

    return {
      accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      userId: session.userId,
    };
  }

  async logout(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new UnauthorizedException('Invalid session');
    }

    await this.sessionService.revokeSession(sessionId);
  }

}
