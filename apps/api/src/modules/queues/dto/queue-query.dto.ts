import {
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import {
  QueueEntryPriority,
  QueueEntryStatus,
  QueueStatus,
} from '@prisma/client';

export class QueueQueryDto {
  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class QueueEntryQueryDto {
  @IsOptional()
  @IsUUID()
  queueId?: string;

  @IsOptional()
  @IsEnum(QueueEntryStatus)
  status?: QueueEntryStatus;

  @IsOptional()
  @IsEnum(QueueEntryPriority)
  priority?: QueueEntryPriority;
}
