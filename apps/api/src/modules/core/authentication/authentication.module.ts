import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { CredentialService } from './credential.service.js';
import { AuthenticationService } from './authentication.service.js';
import { CredentialProvisioningService } from './credential-provisioning.service.js';
import { AuthenticationController } from './authentication.controller.js';
import { SessionModule } from '../sessions/session.module.js';

@Module({
  controllers: [AuthenticationController],
  imports: [
    ConfigModule,
    SessionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('authentication.jwt.secret'),
        signOptions: {
          issuer: config.getOrThrow<string>('authentication.jwt.issuer'),
          audience: config.getOrThrow<string>('authentication.jwt.audience'),
          expiresIn: config.getOrThrow<NonNullable<JwtModuleOptions['signOptions']>['expiresIn']>('authentication.jwt.accessTokenTtl'),
        },
      }),
    }),
  ],
  providers: [
    PasswordService,
    TokenService,
    AccessTokenGuard,
    CredentialService,
    AuthenticationService,
    CredentialProvisioningService,
  ],
  exports: [
    JwtModule,
    SessionModule,
    PasswordService,
    TokenService,
    AccessTokenGuard,
    CredentialService,
    AuthenticationService,
    CredentialProvisioningService,
  ],
})
export class AuthenticationModule {}
