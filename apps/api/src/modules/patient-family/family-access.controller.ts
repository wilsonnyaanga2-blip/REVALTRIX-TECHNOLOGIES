import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { PlatformPermissionGuard } from '../authorization/guards/platform-permission.guard.js';
import { RequirePlatformPermission } from '../authorization/decorators/require-platform-permission.decorator.js';
import {
  CreateFamilyAccessGrantDto,
  FlagDependentRegistrationDto,
  ReviewDependentRegistrationDto,
  UpdateFamilyAccessGrantDto,
  UploadFamilyVerificationDocumentDto,
  VerifyFamilyStepUpDto,
} from './dto/create-family-access-grant.dto.js';
import { FamilyAccessService } from './family-access.service.js';
import { FamilyStepUpGuard } from './family-step-up.guard.js';
import { RequireFamilyStepUp } from './require-family-step-up.decorator.js';

@Controller('v1/patient-family')
@UseGuards(AccessTokenGuard)
export class FamilyAccessController {
  constructor(private readonly familyAccess: FamilyAccessService) {}

  @Post('step-up/request')
  requestStepUp(@Req() request: AuthenticatedRequest) {
    return this.familyAccess.requestStepUp(request.auth.userId, request.auth.sessionId);
  }

  @Post('step-up/verify')
  verifyStepUp(@Req() request: AuthenticatedRequest, @Body() dto: VerifyFamilyStepUpDto) {
    return this.familyAccess.verifyStepUp(request.auth.userId, request.auth.sessionId, dto);
  }

  @Post('access-grants')
  @UseGuards(FamilyStepUpGuard)
  @RequireFamilyStepUp()
  createGrant(@Req() request: AuthenticatedRequest, @Body() dto: CreateFamilyAccessGrantDto) {
    return this.familyAccess.createGrant(request.auth.userId, dto);
  }

  @Get('access-grants')
  listGrants(@Req() request: AuthenticatedRequest) {
    return this.familyAccess.listGrants(request.auth.userId);
  }

  @Patch('access-grants/:grantId')
  @UseGuards(FamilyStepUpGuard)
  @RequireFamilyStepUp()
  updateGrant(
    @Req() request: AuthenticatedRequest,
    @Param('grantId', new ParseUUIDPipe()) grantId: string,
    @Body() dto: UpdateFamilyAccessGrantDto,
  ) {
    return this.familyAccess.updateGrant(request.auth.userId, grantId, dto);
  }

  @Post('access-grants/:grantId/revoke')
  @UseGuards(FamilyStepUpGuard)
  @RequireFamilyStepUp()
  revokeGrant(
    @Req() request: AuthenticatedRequest,
    @Param('grantId', new ParseUUIDPipe()) grantId: string,
  ) {
    return this.familyAccess.revokeGrant(request.auth.userId, grantId);
  }

  @Get('access-grants/:grantId/activity')
  grantActivity(
    @Req() request: AuthenticatedRequest,
    @Param('grantId', new ParseUUIDPipe()) grantId: string,
  ) {
    return this.familyAccess.grantActivity(request.auth.userId, grantId);
  }

  @Post('access-grants/:grantId/review')
  reviewGrant(
    @Req() request: AuthenticatedRequest,
    @Param('grantId', new ParseUUIDPipe()) grantId: string,
  ) {
    return this.familyAccess.reviewGrant(request.auth.userId, grantId);
  }

  @Get('audit-logs')
  auditLogs(@Req() request: AuthenticatedRequest) {
    return this.familyAccess.auditLogs(request.auth.userId);
  }

  @Post('dependents/:registrationId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  uploadDependentDocument(
    @Req() request: AuthenticatedRequest,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body() dto: UploadFamilyVerificationDocumentDto,
    @UploadedFile()
    file?: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    if (!file) throw new BadRequestException('Select a verification document to upload');
    return this.familyAccess.uploadDependentDocument(
      request.auth.userId,
      registrationId,
      dto,
      file,
    );
  }

  @Get('dependents/:registrationId/status')
  dependentStatus(
    @Req() request: AuthenticatedRequest,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
  ) {
    return this.familyAccess.dependentStatus(request.auth.userId, registrationId);
  }

  @Get('admin/dependents')
  @UseGuards(PlatformPermissionGuard)
  @RequirePlatformPermission('patient_dependents', 'review')
  listPendingDependents(@Query('search') search?: string) {
    return this.familyAccess.listPendingDependents(search);
  }

  @Get('admin/dependents/:registrationId/documents/:documentId')
  @UseGuards(PlatformPermissionGuard, FamilyStepUpGuard)
  @RequireFamilyStepUp()
  @RequirePlatformPermission('patient_dependents', 'review')
  async downloadVerificationDocument(
    @Req() request: AuthenticatedRequest,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Res() response: Response,
  ) {
    const document = await this.familyAccess.downloadVerificationDocument(
      documentId,
      registrationId,
      request.auth.userId,
    );
    response.set({
      'Content-Type': document.contentType,
      'Content-Length': document.byteSize,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(document.buffer);
  }

  @Post('admin/dependents/:registrationId/review')
  @UseGuards(PlatformPermissionGuard, FamilyStepUpGuard)
  @RequireFamilyStepUp()
  @RequirePlatformPermission('patient_dependents', 'review')
  reviewDependent(
    @Req() request: AuthenticatedRequest,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body() dto: ReviewDependentRegistrationDto,
  ) {
    return this.familyAccess.reviewDependent(request.auth.userId, registrationId, dto);
  }

  @Post('admin/dependents/:registrationId/flag')
  @UseGuards(PlatformPermissionGuard, FamilyStepUpGuard)
  @RequireFamilyStepUp()
  @RequirePlatformPermission('patient_dependents', 'review')
  flagDependentRegistration(
    @Req() request: AuthenticatedRequest,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body() dto: FlagDependentRegistrationDto,
  ) {
    return this.familyAccess.flagDependentRegistration(request.auth.userId, registrationId, dto);
  }
}
