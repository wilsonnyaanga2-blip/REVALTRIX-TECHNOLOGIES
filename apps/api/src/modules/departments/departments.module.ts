import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { CoreModule } from '../core/core.module.js';
import { DepartmentsController } from './departments.controller.js';
import { DepartmentsService } from './departments.service.js';
import { AuthenticationModule } from '../core/authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, AuthorizationModule, CoreModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
