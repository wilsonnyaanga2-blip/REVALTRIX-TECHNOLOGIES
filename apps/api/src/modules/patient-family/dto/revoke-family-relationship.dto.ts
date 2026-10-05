import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RevokeFamilyRelationshipDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
