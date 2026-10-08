import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QueueEntryPriority } from '@prisma/client';

export class CreateQueueEntryDto {
  @IsUUID()
  queueId!: string;

  @IsUUID()
  encounterId!: string;

  @IsEnum(QueueEntryPriority)
  @IsOptional()
  priority?: QueueEntryPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
