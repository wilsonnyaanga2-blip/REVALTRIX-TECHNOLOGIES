import { IsString, MaxLength, MinLength } from 'class-validator';

export class ExistingPatientLookupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(320)
  identifier!: string;
}
