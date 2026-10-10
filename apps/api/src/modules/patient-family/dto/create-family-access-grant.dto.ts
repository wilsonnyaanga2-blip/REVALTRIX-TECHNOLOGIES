import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export const FAMILY_ACCESS_PERMISSIONS = [
  'profile.read',
  'appointments.read',
  'appointments.manage',
  'reminders.read',
  'documents.read',
  'lab-results.read',
  'prescriptions.read',
  'billing.read',
  'billing.manage',
  'messages.send',
] as const;

export class CreateFamilyAccessGrantDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  delegateId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(FAMILY_ACCESS_PERMISSIONS, { each: true })
  permissions!: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateFamilyAccessGrantDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(FAMILY_ACCESS_PERMISSIONS, { each: true })
  permissions?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ReviewDependentRegistrationDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UploadFamilyVerificationDocumentDto {
  @IsIn([
    'BIRTH_CERTIFICATE',
    'NATIONAL_ID',
    'PASSPORT',
    'GUARDIANSHIP_ORDER',
    'SCHOOL_ID',
    'IMMUNIZATION_CARD',
    'OTHER',
  ])
  documentType!:
    | 'BIRTH_CERTIFICATE'
    | 'NATIONAL_ID'
    | 'PASSPORT'
    | 'GUARDIANSHIP_ORDER'
    | 'SCHOOL_ID'
    | 'IMMUNIZATION_CARD'
    | 'OTHER';
}

export class VerifyFamilyStepUpDto {
  @IsUUID()
  challengeId!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}

export class FlagDependentRegistrationDto {
  @IsString()
  @Length(3, 1000)
  reason!: string;
}
