import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@prisma/client';

import { DatabaseService } from '../../database/database.service.js';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async listMyNotifications(
    userId: string,
    query: {
      unreadOnly?: boolean;
      limit?: number;
    } = {},
  ) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);

    const notifications =
      await this.database.client.notification.findMany({
        where: {
          recipientUserId: userId,
          ...(query.unreadOnly
            ? {
                readAt: null,
              }
            : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          readAt: true,
          createdAt: true,
          deliveries: {
            select: {
              id: true,
              channel: true,
              status: true,
              sentAt: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

    return {
      data: notifications,
    };
  }

  async getMyNotification(
    userId: string,
    notificationId: string,
  ) {
    const notification =
      await this.database.client.notification.findFirst({
        where: {
          id: notificationId,
          recipientUserId: userId,
        },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          readAt: true,
          createdAt: true,
          updatedAt: true,
          deliveries: {
            select: {
              id: true,
              channel: true,
              status: true,
              attempts: true,
              availableAt: true,
              sentAt: true,
              failedAt: true,
              failureReason: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return {
      data: notification,
    };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ) {
    const result =
      await this.database.client.notification.updateMany({
        where: {
          id: notificationId,
          recipientUserId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

    if (result.count === 0) {
      const existing =
        await this.database.client.notification.findFirst({
          where: {
            id: notificationId,
            recipientUserId: userId,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        throw new NotFoundException('Notification not found.');
      }
    }

    return this.getMyNotification(userId, notificationId);
  }

  async markAllAsRead(userId: string) {
    const result =
      await this.database.client.notification.updateMany({
        where: {
          recipientUserId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

    return {
      data: {
        updated: result.count,
      },
    };
  }

  async createNotification(params: {
    tenantId?: string | null;
    recipientUserId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channels?: NotificationChannel[];
    idempotencyPrefix?: string;
  }) {
    const channels =
      params.channels?.length
        ? [...new Set(params.channels)]
        : [NotificationChannel.IN_APP];

    return this.database.client.$transaction(
      async (tx) => {
        const notification = await tx.notification.create({
          data: {
            tenantId: params.tenantId ?? null,
            recipientUserId: params.recipientUserId,
            type: params.type,
            title: params.title,
            body: params.body,
            ...(params.data !== undefined ? { data: params.data as Prisma.InputJsonValue } : {}),
          },
        });

        await tx.notificationDelivery.createMany({
          data: channels.map((channel) => ({
            notificationId: notification.id,
            channel,
            status: NotificationDeliveryStatus.PENDING,
            idempotencyKey:
              `${params.idempotencyPrefix ?? notification.id}:${notification.id}:${channel}`,
          })),
        });

        return notification;
      },
    );
  }
}
