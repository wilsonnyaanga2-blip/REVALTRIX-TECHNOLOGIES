import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePatientInsuranceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  provider?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  memberNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  principalMember?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipToPrincipal?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
