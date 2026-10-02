import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProviderType } from '@prisma/client';

export class CreateProviderDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  providerNumber!: string;

  @IsEnum(ProviderType)
  providerType!: ProviderType;

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
}
