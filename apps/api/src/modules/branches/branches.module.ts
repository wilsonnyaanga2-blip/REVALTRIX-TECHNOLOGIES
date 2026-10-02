import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { CoreModule } from '../core/core.module.js';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, CoreModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
