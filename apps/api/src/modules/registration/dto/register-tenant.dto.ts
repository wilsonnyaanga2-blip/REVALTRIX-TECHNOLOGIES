import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { TenantType } from '@prisma/client';

export class RegisterTenantDto {
  @IsEnum(TenantType)
  tenantType!: TenantType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  adminName!: string;

  @IsEmail()
  @MaxLength(320)
  adminEmail!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  adminPhone!: string;
}
