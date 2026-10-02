import { IsString, IsUUID, Matches } from 'class-validator';

export class VerifyPatientRegistrationDto {
  @IsUUID()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
