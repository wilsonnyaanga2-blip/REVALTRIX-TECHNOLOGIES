import { Module } from '@nestjs/common';

import { AuthenticationModule } from '../core/authentication/authentication.module.js';
import { EmailModule } from '../communication/email/email.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationDeliveryService } from './notification-delivery.service.js';

@Module({
  imports: [AuthenticationModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationDeliveryService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
