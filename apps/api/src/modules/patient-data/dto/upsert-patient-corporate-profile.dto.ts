import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertPatientCorporateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  company!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  employeeNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  corporatePlan?: string;

  @IsOptional()
  @IsObject()
  eligibilityInformation?: Record<string, unknown>;
}
