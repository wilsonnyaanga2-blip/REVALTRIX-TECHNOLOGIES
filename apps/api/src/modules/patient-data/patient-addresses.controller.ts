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
import { CreatePatientAddressDto } from './dto/create-patient-address.dto.js';
import { UpdatePatientAddressDto } from './dto/update-patient-address.dto.js';
import { PatientAddressesService } from './patient-addresses.service.js';

@Controller('v1/patient-data/addresses')
@UseGuards(AccessTokenGuard)
export class PatientAddressesController {
  constructor(
    private readonly patientAddressesService: PatientAddressesService,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.patientAddressesService.listMyAddresses(
      request.auth.userId,
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePatientAddressDto,
  ) {
    return this.patientAddressesService.createMyAddress(
      request.auth.userId,
      dto,
    );
  }

  @Put(':addressId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('addressId') addressId: string,
    @Body() dto: UpdatePatientAddressDto,
  ) {
    return this.patientAddressesService.updateMyAddress(
      request.auth.userId,
      addressId,
      dto,
    );
  }

  @Post(':addressId/set-primary')
  async setPrimary(
    @Req() request: AuthenticatedRequest,
    @Param('addressId') addressId: string,
  ) {
    return this.patientAddressesService.setPrimaryAddress(
      request.auth.userId,
      addressId,
    );
  }

  @Delete(':addressId')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('addressId') addressId: string,
  ) {
    return this.patientAddressesService.deleteMyAddress(
      request.auth.userId,
      addressId,
    );
  }
}
