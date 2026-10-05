import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePatientAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  county?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  town?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  area?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  physicalAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  postalAddress?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
