import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AmendClinicalNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  amendmentReason?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}
