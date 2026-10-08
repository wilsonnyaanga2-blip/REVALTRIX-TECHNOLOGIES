import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PatientFamilyRelationshipTypeDto } from './create-family-relationship-request.dto.js';

export class CreateDependentRegistrationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  secondName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsEnum(PatientFamilyRelationshipTypeDto)
  relationshipType!: PatientFamilyRelationshipTypeDto;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
