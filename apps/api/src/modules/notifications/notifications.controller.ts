import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../core/authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../core/authentication/guards/access-token.guard.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { NotificationsService } from './notifications.service.js';

@Controller('v1/notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.listMyNotifications(
      request.auth.userId,
      query,
    );
  }

  @Get(':notificationId')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.getMyNotification(
      request.auth.userId,
      notificationId,
    );
  }

  @Patch(':notificationId/read')
  async markAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(
      request.auth.userId,
      notificationId,
    );
  }

  @Patch('read-all')
  async markAllAsRead(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAllAsRead(
      request.auth.userId,
    );
  }
}
