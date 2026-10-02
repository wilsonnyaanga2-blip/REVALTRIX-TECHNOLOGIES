import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailConfig {
  constructor(private readonly config: ConfigService) {}

  get host(): string {
    return this.required('SMTP_HOST');
  }

  get port(): number {
    const value = this.config.get<string>('SMTP_PORT', '587');
    const port = Number(value);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT must be a valid port number');
    }

    return port;
  }

  get secure(): boolean {
    return this.config.get<string>('SMTP_SECURE', 'false') === 'true';
  }

  get username(): string {
    return this.required('SMTP_USERNAME');
  }

  get password(): string {
    return this.required('SMTP_PASSWORD');
  }

  get fromEmail(): string {
    return this.required('SMTP_FROM_EMAIL');
  }

  get fromName(): string {
    return this.config.get<string>('SMTP_FROM_NAME', 'Revaltrix');
  }

  private required(name: string): string {
    const value = this.config.get<string>(name)?.trim();

    if (!value) {
      throw new Error(`${name} is required`);
    }

    return value;
  }
}
