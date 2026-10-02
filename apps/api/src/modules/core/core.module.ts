import { AccountModule } from './account/account.module.js';
import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { SessionModule } from './sessions/session.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [AccountModule, IdentityModule, AuthenticationModule, SessionModule],
  exports: [IdentityModule, AuthenticationModule, SessionModule],
})
export class CoreModule {}
