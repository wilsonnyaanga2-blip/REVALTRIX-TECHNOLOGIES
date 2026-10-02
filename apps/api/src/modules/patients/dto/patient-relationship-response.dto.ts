import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PatientRelationshipResponseDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
