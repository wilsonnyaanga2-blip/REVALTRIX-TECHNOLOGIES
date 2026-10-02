import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';

@Controller('v1/dashboard')
@UseGuards(AccessTokenGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  async getDashboard(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.dashboardService.getDashboard(
      request.auth.userId,
    );
  }

  @Get('hospital')
  async getHospitalDashboard(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.dashboardService.getHospitalDashboard(
      request.auth.userId,
    );
  }
}
