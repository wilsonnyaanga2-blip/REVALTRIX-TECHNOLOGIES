import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum PatientFamilyRelationshipTypeDto {
  SPOUSE = 'SPOUSE',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  SIBLING = 'SIBLING',
  GRANDPARENT = 'GRANDPARENT',
  GRANDCHILD = 'GRANDCHILD',
  GUARDIAN = 'GUARDIAN',
  DEPENDENT = 'DEPENDENT',
  OTHER = 'OTHER',
}

export class CreateFamilyRelationshipRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  targetPlatformPatientId!: string;

  @IsEnum(PatientFamilyRelationshipTypeDto)
  relationshipType!: PatientFamilyRelationshipTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
