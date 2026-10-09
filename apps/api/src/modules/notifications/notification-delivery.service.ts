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
import { ConfigService } from '@nestjs/config';
import webPush from 'web-push';

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
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('notifications.webPush.publicKey');
    const privateKey = this.config.get<string>('notifications.webPush.privateKey');

    if (publicKey && privateKey) {
      webPush.setVapidDetails(
        this.config.get<string>('notifications.webPush.subject') ??
          'mailto:admin@revaltrix.com',
        publicKey,
        privateKey,
      );
    }

    void this.processPendingDeliveries();

    this.timer = setInterval(() => {
      void this.processPendingDeliveries();
    }, this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async processPendingDeliveries(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const now = new Date();

      const deliveries =
        await this.database.client.notificationDelivery.findMany({
          where: {
            channel: {
              in: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
            },
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
        'Notification delivery processing cycle failed',
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
          channel: {
            in: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
          },
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
          channel: true,
          attempts: true,
          notification: {
            select: {
              id: true,
              type: true,
              title: true,
              body: true,
              data: true,
              recipientUserId: true,
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

    if (delivery.channel === NotificationChannel.PUSH) {
      await this.processPushDelivery(delivery);
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

  private async processPushDelivery(delivery: {
    id: string;
    attempts: number;
    notification: {
      id: string;
      type: string;
      title: string;
      body: string;
      data: unknown;
      recipientUserId: string;
    };
  }): Promise<void> {
    const publicKey = this.config.get<string>('notifications.webPush.publicKey');
    const privateKey = this.config.get<string>('notifications.webPush.privateKey');

    if (!publicKey || !privateKey) {
      await this.failDelivery(
        delivery.id,
        delivery.attempts,
        'Web push is not configured on this server.',
      );
      return;
    }

    const subscriptions =
      await this.database.client.webPushSubscription.findMany({
        where: {
          userId: delivery.notification.recipientUserId,
        },
        select: {
          id: true,
          endpoint: true,
          p256dh: true,
          auth: true,
        },
      });

    if (subscriptions.length === 0) {
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
      return;
    }

    const payload = JSON.stringify({
      id: delivery.notification.id,
      type: delivery.notification.type,
      title: delivery.notification.title,
      body: delivery.notification.body,
      data: delivery.notification.data,
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
          );
        } catch (error) {
          const statusCode =
            typeof error === 'object' && error !== null && 'statusCode' in error
              ? error.statusCode
              : undefined;

          if (statusCode === 404 || statusCode === 410) {
            await this.database.client.webPushSubscription.deleteMany({
              where: {
                id: subscription.id,
              },
            });
            return;
          }

          throw error;
        }
      }),
    );
    const failures = results.filter(
      (result): result is PromiseRejectedResult =>
        result.status === 'rejected',
    );

    if (failures.length === subscriptions.length) {
      await this.failDelivery(
        delivery.id,
        delivery.attempts,
        failures
          .map((failure) =>
            failure.reason instanceof Error
              ? failure.reason.message
              : String(failure.reason),
          )
          .join('; '),
      );
      return;
    }

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
