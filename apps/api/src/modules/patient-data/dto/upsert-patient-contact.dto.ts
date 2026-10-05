import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertPatientContactDto {
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  alternativePhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;
}
