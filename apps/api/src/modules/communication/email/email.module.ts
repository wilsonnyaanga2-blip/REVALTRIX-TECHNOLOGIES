import { Module } from '@nestjs/common';
import { EmailConfig } from './email.config.js';
import { EmailService } from './email.service.js';
import { VerificationEmailService } from './verification-email.service.js';

@Module({
  providers: [
    EmailConfig,
    EmailService,
    VerificationEmailService,
  ],
  exports: [
    EmailService,
    VerificationEmailService,
  ],
})
export class EmailModule {}
