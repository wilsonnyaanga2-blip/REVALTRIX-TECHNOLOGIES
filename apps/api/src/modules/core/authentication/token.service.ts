import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  type: 'access';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async createAccessToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    return this.jwt.signAsync({
      sub: userId,
      sid: sessionId,
      type: 'access',
    } satisfies AccessTokenPayload);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        issuer: this.config.getOrThrow<string>('authentication.jwt.issuer'),
        audience: this.config.getOrThrow<string>('authentication.jwt.audience'),
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
