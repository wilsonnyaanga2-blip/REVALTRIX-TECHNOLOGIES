import { IsIn } from 'class-validator';

export class RequestVerificationDto {
  @IsIn(['EMAIL', 'PHONE'])
  channel!: 'EMAIL' | 'PHONE';
}
