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
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';
import { EmergencyContactsService } from './emergency-contacts.service.js';

@Controller('v1/patient-data/emergency-contacts')
@UseGuards(AccessTokenGuard)
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.emergencyContactsService.listMyEmergencyContacts(
      request.auth.userId,
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.emergencyContactsService.createMyEmergencyContact(
      request.auth.userId,
      dto,
    );
  }

  @Put(':contactId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.emergencyContactsService.updateMyEmergencyContact(
      request.auth.userId,
      contactId,
      dto,
    );
  }

  @Delete(':contactId')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('contactId') contactId: string,
  ) {
    return this.emergencyContactsService.deleteMyEmergencyContact(
      request.auth.userId,
      contactId,
    );
  }
}
