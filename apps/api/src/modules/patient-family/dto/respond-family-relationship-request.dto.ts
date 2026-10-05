import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum PatientFamilyRelationshipResponseDto {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
}

export class RespondFamilyRelationshipRequestDto {
  @IsEnum(PatientFamilyRelationshipResponseDto)
  response!: PatientFamilyRelationshipResponseDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  responseReason?: string;
}
