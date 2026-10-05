import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { CreateNextOfKinDto } from './dto/create-next-of-kin.dto.js';
import { UpdateNextOfKinDto } from './dto/update-next-of-kin.dto.js';
import { NextOfKinService } from './next-of-kin.service.js';

@Controller('v1/patient-data/next-of-kin')
@UseGuards(AccessTokenGuard)
export class NextOfKinController {
  constructor(
    private readonly nextOfKinService: NextOfKinService,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.nextOfKinService.listMyNextOfKin(
      request.auth.userId,
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateNextOfKinDto,
  ) {
    return this.nextOfKinService.createMyNextOfKin(
      request.auth.userId,
      dto,
    );
  }

  @Put(':nextOfKinId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('nextOfKinId') nextOfKinId: string,
    @Body() dto: UpdateNextOfKinDto,
  ) {
    return this.nextOfKinService.updateMyNextOfKin(
      request.auth.userId,
      nextOfKinId,
      dto,
    );
  }

  @Delete(':nextOfKinId')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('nextOfKinId') nextOfKinId: string,
  ) {
    return this.nextOfKinService.deleteMyNextOfKin(
      request.auth.userId,
      nextOfKinId,
    );
  }
}
