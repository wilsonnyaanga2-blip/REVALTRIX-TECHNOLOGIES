import { IsString, IsUrl, MaxLength } from 'class-validator';

export class WebPushSubscriptionDto {
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  endpoint!: string;

  @IsString()
  @MaxLength(255)
  p256dh!: string;

  @IsString()
  @MaxLength(255)
  auth!: string;
}
