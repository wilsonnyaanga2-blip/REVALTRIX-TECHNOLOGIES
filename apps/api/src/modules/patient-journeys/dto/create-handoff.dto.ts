import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateHandoffDto {
  @IsUUID()
  fromStepId!: string;

  @IsUUID()
  toDepartmentId!: string;

  @IsOptional()
  @IsUUID()
  toBranchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instruction?: string;
}
