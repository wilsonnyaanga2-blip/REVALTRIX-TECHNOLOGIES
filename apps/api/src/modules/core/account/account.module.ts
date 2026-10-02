import { Module } from '@nestjs/common';
import { AccountController } from './account.controller.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule],
  controllers: [AccountController],
})
export class AccountModule {}
