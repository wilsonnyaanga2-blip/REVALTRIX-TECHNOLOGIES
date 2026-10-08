import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';

export class TransitionEncounterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
