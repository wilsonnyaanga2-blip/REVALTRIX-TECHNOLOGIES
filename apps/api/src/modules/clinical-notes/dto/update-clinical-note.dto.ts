import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateClinicalNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subjective?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  objective?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  assessment?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  plan?: string;
}
