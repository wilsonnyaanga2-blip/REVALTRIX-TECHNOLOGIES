import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProviderType, RecordStatus } from '@prisma/client';

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  providerNumber?: string;

  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  professionalTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subspecialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  registrationBody?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
