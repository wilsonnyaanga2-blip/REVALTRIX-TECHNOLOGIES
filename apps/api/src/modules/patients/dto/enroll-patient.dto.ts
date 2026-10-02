import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EnrollPatientDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  platformPatientId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  patientNumber?: string;
}
