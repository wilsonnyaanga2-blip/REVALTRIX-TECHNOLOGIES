import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum PatientRegistrationVerificationChannel {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export class RegisterPatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  secondName!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  patientNumber?: string;

  @IsEnum(PatientRegistrationVerificationChannel)
  verificationChannel!: PatientRegistrationVerificationChannel;

}
