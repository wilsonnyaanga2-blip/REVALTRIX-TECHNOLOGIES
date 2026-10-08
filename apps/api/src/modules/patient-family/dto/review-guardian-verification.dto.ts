import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum GuardianVerificationDecision {
  VERIFY = 'VERIFY',
  REJECT = 'REJECT',
}

export class ReviewGuardianVerificationDto {
  @IsEnum(GuardianVerificationDecision)
  decision!: GuardianVerificationDecision;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason?: string;
}
