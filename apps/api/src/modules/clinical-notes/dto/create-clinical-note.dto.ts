import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ClinicalNoteType } from '@prisma/client';

export class CreateClinicalNoteDto {
  @IsUUID()
  patientTenantRecordId!: string;

  @IsUUID()
  encounterId!: string;

  @IsEnum(ClinicalNoteType)
  type!: ClinicalNoteType;

  @IsOptional()
  @IsUUID()
  authorProviderId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subjective?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  objective?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  assessment?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  plan?: string;
}
