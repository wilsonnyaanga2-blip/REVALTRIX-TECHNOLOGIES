import { IsEnum } from 'class-validator';

export enum GuardianVerificationDocumentTypeDto {
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  BIRTH_NOTIFICATION = 'BIRTH_NOTIFICATION',
}

export class SubmitGuardianVerificationDocumentDto {
  @IsEnum(GuardianVerificationDocumentTypeDto)
  type!: GuardianVerificationDocumentTypeDto;
}
