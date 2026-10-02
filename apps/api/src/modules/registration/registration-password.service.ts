import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IdentityType,
  OnboardingStatus,
  RecordStatus,
  RegistrationStatus,
  RegistrationType,
  VerificationStatus,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service.js';
import { CredentialProvisioningService } from '../core/authentication/credential-provisioning.service.js';

@Injectable()
export class RegistrationPasswordService {
  constructor(
    private readonly database: DatabaseService,
    private readonly credentialProvisioning: CredentialProvisioningService,
  ) {}

  async setPassword(
    userId: string,
    password: string,
    confirmPassword: string,
  ) {
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const registration =
      await this.database.client.registration.findFirst({
        where: {
          userId,
          status: {
            in: [
              RegistrationStatus.INITIATED,
              RegistrationStatus.VERIFICATION_REQUIRED,
              RegistrationStatus.ONBOARDING,
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          status: true,
          verificationStatus: true,
          onboardingStatus: true,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'No active registration was found for this account',
      );
    }

    if (registration.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new UnauthorizedException(
        'Email verification is required before setting a password',
      );
    }

    const emailIdentity =
      await this.database.client.identity.findFirst({
        where: {
          userId,
          type: IdentityType.EMAIL,
          status: RecordStatus.ACTIVE,
        },
        select: {
          id: true,
          value: true,
          verifiedAt: true,
          credentialHash: true,
        },
      });

    if (!emailIdentity) {
      throw new NotFoundException(
        'No active email identity was found for this account',
      );
    }

    if (!emailIdentity.verifiedAt) {
      throw new UnauthorizedException(
        'Email verification is required before setting a password',
      );
    }

    if (emailIdentity.credentialHash) {
      throw new ConflictException(
        'A password has already been configured for this account',
      );
    }

    await this.credentialProvisioning.setPasswordCredential(
      userId,
      IdentityType.EMAIL,
      emailIdentity.value,
      password,
    );

    const updatedRegistration =
      await this.database.client.registration.update({
        where: {
          id: registration.id,
        },
        data: {
          status: RegistrationStatus.ONBOARDING,
          onboardingStatus: OnboardingStatus.IN_PROGRESS,
        },
        select: {
          id: true,
          type: true,
          status: true,
          verificationStatus: true,
          onboardingStatus: true,
        },
      });

    return {
      passwordConfigured: true,
      registrationId: updatedRegistration.id,
      registrationType: updatedRegistration.type,
      registrationStatus: updatedRegistration.status,
      verificationStatus: updatedRegistration.verificationStatus,
      onboardingStatus: updatedRegistration.onboardingStatus,
    };
  }

  async getPasswordStatus(userId: string) {
    const identity =
      await this.database.client.identity.findFirst({
        where: {
          userId,
          type: IdentityType.EMAIL,
          status: RecordStatus.ACTIVE,
        },
        select: {
          credentialHash: true,
        },
      });

    return {
      configured: Boolean(identity?.credentialHash),
    };
  }
}
