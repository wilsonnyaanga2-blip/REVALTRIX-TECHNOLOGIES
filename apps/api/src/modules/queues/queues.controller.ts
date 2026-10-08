import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
import { PermissionGuard } from '../authorization/guards/permission.guard.js';
import { RequirePermission } from '../authorization/decorators/require-permission.decorator.js';
import { CreateQueueDto } from './dto/create-queue.dto.js';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto.js';
import { CreateQueueCareRecordDto } from './dto/create-queue-care-record.dto.js';
import {
  QueueEntryQueryDto,
  QueueQueryDto,
} from './dto/queue-query.dto.js';
import { QueuesService } from './queues.service.js';

@Controller('v1/queues')
@UseGuards(AccessTokenGuard)
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post('reconcile/today')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async reconcileToday(@Req() request: AuthenticatedRequest) {
    return this.queuesService.reconcileTodayCheckedInEncounters(
      request.auth!.userId,
    );
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'read')
  async listQueues(
    @Req() request: AuthenticatedRequest,
    @Query() query: QueueQueryDto,
  ) {
    return this.queuesService.listQueues(
      request.auth.userId,
      query,
    );
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'create')
  async createQueue(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateQueueDto,
  ) {
    return this.queuesService.createQueue(
      request.auth.userId,
      dto,
    );
  }

  @Get('my')
  async listMyQueue(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.queuesService.listMyQueue(
      request.auth.userId,
    );
  }

  @Post('my/:entryId/acknowledge')
  async acknowledgeMyQueueCall(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.acknowledgeMyQueueCall(
      request.auth.userId,
      entryId,
    );
  }

  @Get(':queueId')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'read')
  async getQueue(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
  ) {
    return this.queuesService.getQueue(
      request.auth.userId,
      queueId,
    );
  }

  @Get(':queueId/entries')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'read')
  async listEntries(
    @Req() request: AuthenticatedRequest,
    @Param('queueId') queueId: string,
    @Query() query: QueueEntryQueryDto,
  ) {
    return this.queuesService.listEntries(
      request.auth.userId,
      queueId,
      query,
    );
  }

  @Post('entries')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'create')
  async createEntry(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateQueueEntryDto,
  ) {
    return this.queuesService.createEntry(
      request.auth.userId,
      dto,
    );
  }

  @Get('entries/:entryId/care-records')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'read')
  async listCareRecords(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.listCareRecords(
      request.auth.userId,
      entryId,
    );
  }

  @Post('entries/:entryId/care-records')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async createCareRecord(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
    @Body() dto: CreateQueueCareRecordDto,
  ) {
    return this.queuesService.createCareRecord(
      request.auth.userId,
      entryId,
      dto,
    );
  }

  @Post('care-records/:careRecordId/attachments')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async uploadCareAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('careRecordId') careRecordId: string,
    @UploadedFile()
    file?: {
      originalname: string;
      mimetype: string;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new BadRequestException('Select a clinical file to upload');
    }

    return this.queuesService.uploadCareAttachment(
      request.auth.userId,
      careRecordId,
      file,
    );
  }

  @Get('care-attachments/:attachmentId/download')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'read')
  async downloadCareAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ) {
    const attachment =
      await this.queuesService.downloadCareAttachment(
        request.auth.userId,
        attachmentId,
      );

    response.set({
      'Content-Type': attachment.contentType,
      'Content-Length': attachment.byteSize,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(attachment.buffer);
  }

  @Post('entries/:entryId/call')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async call(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.call(
      request.auth.userId,
      entryId,
    );
  }

  @Post('entries/:entryId/start')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async start(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.start(
      request.auth.userId,
      entryId,
    );
  }

  @Post('entries/:entryId/complete')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async complete(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.complete(
      request.auth.userId,
      entryId,
    );
  }

  @Post('entries/:entryId/skip')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async skip(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.skip(
      request.auth.userId,
      entryId,
    );
  }

  @Post('entries/:entryId/no-show')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async noShow(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.noShow(
      request.auth.userId,
      entryId,
    );
  }

  @Post('entries/:entryId/cancel')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'update')
  async cancel(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.cancel(
      request.auth.userId,
      entryId,
    );
  }

  @Get('entries/:entryId/history')
  @UseGuards(PermissionGuard)
  @RequirePermission('queues', 'read')
  async history(
    @Req() request: AuthenticatedRequest,
    @Param('entryId') entryId: string,
  ) {
    return this.queuesService.getHistory(
      request.auth.userId,
      entryId,
    );
  }
}
