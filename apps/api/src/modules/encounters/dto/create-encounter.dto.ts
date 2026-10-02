import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { EncounterType } from '@prisma/client';

export class CreateEncounterDto {
  @IsUUID()
  patientTenantRecordId!: string;

  @IsEnum(EncounterType)
  type!: EncounterType;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason?: string;
}
