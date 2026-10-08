import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  IdentityType,
  RegistrationStatus,
  RegistrationType,
  VerificationStatus,
  OnboardingStatus,
  TenantType,
} from '@prisma/client';
import { randomBytes, createHash } from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { RegisterPatientDto } from './dto/register-patient.dto.js';

@Injectable()
export class RegistrationService {
  constructor(private readonly database: DatabaseService) {}

  async registerTenant(dto: RegisterTenantDto) {
    const email = dto.adminEmail.trim().toLowerCase();
    const phone = this.normalizePhone(dto.adminPhone);

    const existingEmail = await this.database.client.identity.findUnique({
      where: {
        type_normalizedValue: {
          type: IdentityType.EMAIL,
          normalizedValue: email,
        },
      },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const existingPhone = await this.database.client.identity.findUnique({
      where: {
        type_normalizedValue: {
          type: IdentityType.PHONE,
          normalizedValue: phone,
        },
      },
      select: { id: true },
    });

    if (existingPhone) {
      throw new ConflictException('Phone is already registered');
    }

    const result = await this.database.client.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          displayName: dto.adminName.trim(),
        },
      });

      await tx.identity.create({
        data: {
          userId: user.id,
          type: IdentityType.EMAIL,
          value: dto.adminEmail.trim(),
          normalizedValue: email,
        },
      });

      await tx.identity.create({
        data: {
          userId: user.id,
          type: IdentityType.PHONE,
          value: dto.adminPhone.trim(),
          normalizedValue: phone,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          type: dto.tenantType,
          name: dto.businessName.trim(),
          code: await this.generateTenantCode(tx, dto.businessName),
          profile: {
            create: {
              businessName: dto.businessName.trim(),
              country: 'Kenya',
              contactEmail: email,
              contactPhone: dto.adminPhone.trim(),
            },
          },
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Tenant Administrator',
          code: 'TENANT_ADMIN',
          scope: 'TENANT',
          description: 'Administrator for the tenant',
        },
      });

      const permissions = await tx.permission.findMany({
        where: {
          tenantId: null,
          scope: 'TENANT',
          effect: 'ALLOW',
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });

      if (permissions.length === 0) {
        throw new ConflictException(
          'Authorization permission catalog is not configured',
        );
      }

      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: adminRole.id,
        },
      });

      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: adminRole.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          type: RegistrationType.TENANT,
          status: RegistrationStatus.VERIFICATION_REQUIRED,
          verificationStatus: VerificationStatus.PENDING,
          onboardingStatus: OnboardingStatus.NOT_STARTED,
        },
      });

      return {
        user,
        tenant,
        registration,
      };
    });

    const registrationToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256')
      .update(registrationToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.database.client.registrationSession.create({
      data: {
        userId: result.user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      registrationId: result.registration.id,
      tenantId: result.tenant.id,
      userId: result.user.id,
      status: result.registration.status,
      verificationStatus: result.registration.verificationStatus,
      onboardingStatus: result.registration.onboardingStatus,
      registrationToken,
      registrationTokenExpiresAt: expiresAt,
    };
  }

  async registerPatient(dto: RegisterPatientDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = this.normalizePhone(dto.phone);

    const existingEmail = await this.database.client.identity.findUnique({
      where: {
        type_normalizedValue: {
          type: IdentityType.EMAIL,
          normalizedValue: email,
        },
      },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const existingPhone = await this.database.client.identity.findUnique({
      where: {
        type_normalizedValue: {
          type: IdentityType.PHONE,
          normalizedValue: phone,
        },
      },
      select: { id: true },
    });

    if (existingPhone) {
      throw new ConflictException('Phone is already registered');
    }

    const result = await this.database.client.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          displayName: `${dto.firstName.trim()} ${dto.secondName.trim()}`,
        },
      });

      await tx.identity.create({
        data: {
          userId: user.id,
          type: IdentityType.EMAIL,
          value: dto.email.trim(),
          normalizedValue: email,
        },
      });

      await tx.identity.create({
        data: {
          userId: user.id,
          type: IdentityType.PHONE,
          value: dto.phone.trim(),
          normalizedValue: phone,
        },
      });

      await tx.patientProfile.create({
        data: {
          userId: user.id,
          firstName: dto.firstName.trim(),
          secondName: dto.secondName.trim(),
          location: dto.location.trim(),
        },
      });

      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          type: RegistrationType.PATIENT,
          status: RegistrationStatus.VERIFICATION_REQUIRED,
          verificationStatus: VerificationStatus.PENDING,
          onboardingStatus: OnboardingStatus.NOT_STARTED,
        },
      });

      return {
        user,
        registration,
      };
    });

    const registrationToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256')
      .update(registrationToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.database.client.registrationSession.create({
      data: {
        userId: result.user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      registrationId: result.registration.id,
      userId: result.user.id,
      status: result.registration.status,
      verificationStatus: result.registration.verificationStatus,
      onboardingStatus: result.registration.onboardingStatus,
      registrationToken,
      registrationTokenExpiresAt: expiresAt,
    };
  }

  private normalizePhone(phone: string): string {
    return phone.trim().replace(/[^\d+]/g, '');
  }

  private async generateTenantCode(
    tx: Parameters<
      Parameters<typeof this.database.client.$transaction>[0]
    >[0],
    businessName: string,
  ): Promise<string> {
    const base = businessName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 12) || 'TENANT';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const suffix = randomBytes(3).toString('hex').toUpperCase();
      const code = `${base}-${suffix}`;

      const existing = await tx.tenant.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
    }

    throw new ConflictException(
      'Unable to generate a unique tenant code',
    );
  }
}
