import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';

@Controller('v1/branches')
@UseGuards(AccessTokenGuard)
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('branches', 'read')
  async list(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.branchesService.list(
      request.auth.userId,
    );
  }

  @Get(':branchId')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('branchId') branchId: string,
  ) {
    return this.branchesService.getById(
      request.auth.userId,
      branchId,
    );
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('branches', 'create')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(
      request.auth.userId,
      dto,
    );
  }

  @Patch(':branchId')
  @UseGuards(PermissionGuard)
  @RequirePermission('branches', 'update')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(
      request.auth.userId,
      branchId,
      dto,
    );
  }

  @Delete(':branchId')
  @UseGuards(PermissionGuard)
  @RequirePermission('branches', 'delete')
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('branchId') branchId: string,
  ) {
    return this.branchesService.remove(
      request.auth.userId,
      branchId,
    );
  }
}
