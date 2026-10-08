import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  IdentityType,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@prisma/client';

import { DatabaseService } from '../../database/database.service.js';
import { EmailService } from '../communication/email/email.service.js';

@Injectable()
export class NotificationDeliveryService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationDeliveryService.name);
  private readonly intervalMs = 5_000;
  private readonly batchSize = 25;
  private readonly maxAttempts = 5;

  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    void this.processPendingEmails();

    this.timer = setInterval(() => {
      void this.processPendingEmails();
    }, this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async processPendingEmails(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const now = new Date();

      const deliveries =
        await this.database.client.notificationDelivery.findMany({
          where: {
            channel: NotificationChannel.EMAIL,
            status: NotificationDeliveryStatus.PENDING,
            availableAt: {
              lte: now,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: this.batchSize,
          select: {
            id: true,
          },
        });

      for (const delivery of deliveries) {
        await this.processDelivery(delivery.id);
      }
    } catch (error) {
      this.logger.error(
        'Notification email processing cycle failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.processing = false;
    }
  }

  private async processDelivery(deliveryId: string): Promise<void> {
    const claimed =
      await this.database.client.notificationDelivery.updateMany({
        where: {
          id: deliveryId,
          channel: NotificationChannel.EMAIL,
          status: NotificationDeliveryStatus.PENDING,
          availableAt: {
            lte: new Date(),
          },
        },
        data: {
          status: NotificationDeliveryStatus.PROCESSING,
          processingAt: new Date(),
          attempts: {
            increment: 1,
          },
        },
      });

    if (claimed.count !== 1) {
      return;
    }

    const delivery =
      await this.database.client.notificationDelivery.findUnique({
        where: {
          id: deliveryId,
        },
        select: {
          id: true,
          attempts: true,
          notification: {
            select: {
              title: true,
              body: true,
              recipientUser: {
                select: {
                  identities: {
                    where: {
                      type: IdentityType.EMAIL,
                      status: 'ACTIVE',
                      verifiedAt: {
                        not: null,
                      },
                    },
                    orderBy: {
                      createdAt: 'asc',
                    },
                    take: 1,
                    select: {
                      value: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!delivery) {
      return;
    }

    const email =
      delivery.notification.recipientUser.identities[0]?.value?.trim();

    if (!email) {
      await this.failDelivery(
        delivery.id,
        delivery.attempts,
        'No active verified email identity exists for the notification recipient.',
      );
      return;
    }

    try {
      const subject = delivery.notification.title.trim();
      const text = delivery.notification.body.trim();

      await this.emailService.send({
        to: email,
        subject,
        text,
        html: this.toHtml(text),
      });

      await this.database.client.notificationDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
          failureReason: null,
        },
      });

      this.logger.log(
        `Notification email sent successfully: delivery=${delivery.id}`,
      );
    } catch (error) {
      await this.failDelivery(
        delivery.id,
        delivery.attempts,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async failDelivery(
    deliveryId: string,
    attempts: number,
    reason: string,
  ): Promise<void> {
    const terminal = attempts >= this.maxAttempts;

    const delayMinutes = Math.min(60, 2 ** Math.max(attempts - 1, 0));

    await this.database.client.notificationDelivery.update({
      where: {
        id: deliveryId,
      },
      data: {
        status: terminal
          ? NotificationDeliveryStatus.FAILED
          : NotificationDeliveryStatus.PENDING,
        availableAt: terminal
          ? new Date()
          : new Date(Date.now() + delayMinutes * 60_000),
        failedAt: new Date(),
        failureReason: reason.slice(0, 2000),
      },
    });

    if (terminal) {
      this.logger.error(
        `Notification email permanently failed after ${attempts} attempts: delivery=${deliveryId}; reason=${reason}`,
      );
    } else {
      this.logger.warn(
        `Notification email failed; retry scheduled: delivery=${deliveryId}; attempt=${attempts}; reason=${reason}`,
      );
    }
  }

  private toHtml(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-line">${escaped}</div>`;
  }
}
