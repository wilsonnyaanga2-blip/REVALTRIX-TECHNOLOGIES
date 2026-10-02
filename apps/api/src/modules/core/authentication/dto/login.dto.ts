import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { IdentityType } from '@prisma/client';

export class LoginDto {
  @IsEnum(IdentityType)
  identityType!: IdentityType;

  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
