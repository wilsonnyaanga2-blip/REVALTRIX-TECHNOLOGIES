import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePatientOnboardingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  secondName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  location?: string;
}
