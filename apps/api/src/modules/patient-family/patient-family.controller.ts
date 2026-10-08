import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { CreateFamilyRelationshipRequestDto } from './dto/create-family-relationship-request.dto.js';
import { CreateDependentRegistrationDto } from './dto/create-dependent-registration.dto.js';
import { RespondFamilyRelationshipRequestDto } from './dto/respond-family-relationship-request.dto.js';
import { RevokeFamilyRelationshipDto } from './dto/revoke-family-relationship.dto.js';
import { PatientFamilyService } from './patient-family.service.js';

@Controller('v1/patient-family')
@UseGuards(AccessTokenGuard)
export class PatientFamilyController {
  constructor(
    private readonly patientFamilyService: PatientFamilyService,
  ) {}

  @Get('relationships')
  async listRelationships(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientFamilyService.listRelationships(
      request.auth.userId,
    );
  }

  @Get('requests')
  async listPendingRequests(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientFamilyService.listPendingRequests(
      request.auth.userId,
    );
  }

  @Post('dependents')
  async registerDependent(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDependentRegistrationDto,
  ) {
    return this.patientFamilyService.registerDependent(
      request.auth.userId,
      dto,
    );
  }

  @Post('requests')
  async createRequest(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateFamilyRelationshipRequestDto,
  ) {
    return this.patientFamilyService.createRequest(
      request.auth.userId,
      dto,
    );
  }

  @Post('requests/:requestId/respond')
  async respondToRequest(
    @Req() request: AuthenticatedRequest,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() dto: RespondFamilyRelationshipRequestDto,
  ) {
    return this.patientFamilyService.respondToRequest(
      request.auth.userId,
      requestId,
      dto,
    );
  }

  @Delete('requests/:requestId')
  async cancelRequest(
    @Req() request: AuthenticatedRequest,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.patientFamilyService.cancelRequest(
      request.auth.userId,
      requestId,
    );
  }

  @Post('relationships/:relationshipId/revoke')
  async revokeRelationship(
    @Req() request: AuthenticatedRequest,
    @Param('relationshipId', new ParseUUIDPipe()) relationshipId: string,
    @Body() dto: RevokeFamilyRelationshipDto,
  ) {
    return this.patientFamilyService.revokeRelationship(
      request.auth.userId,
      relationshipId,
      dto,
    );
  }
}
