import { IsEnum, IsString, MinLength } from 'class-validator';
import { IdentityType } from '@prisma/client';

export class SetCredentialDto {
  @IsEnum(IdentityType)
  identityType!: IdentityType;

  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
