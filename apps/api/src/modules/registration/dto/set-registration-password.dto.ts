import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetRegistrationPasswordDto {
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  confirmPassword!: string;
}
