import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PatientDataSource, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service.js';
import { UpsertPatientCorporateProfileDto } from './dto/upsert-patient-corporate-profile.dto.js';

@Injectable()
export class PatientCorporateProfileService {
  constructor(private readonly database: DatabaseService) {}

  private normalizeText(value: string): string {
    return value.trim().replace(/\\s+/g, ' ');
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = this.normalizeText(value);
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeEmployeeNumber(value?: string | null): string | null {
    const normalized = this.normalizeOptionalText(value);
    return normalized ? normalized.toUpperCase() : null;
  }

  private async getPatientProfileId(userId: string): Promise<string> {
    const profile = await this.database.client.patientProfile.findFirst({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found.');
    }

    return profile.id;
  }

  async getMyCorporateProfile(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    return this.database.client.patientCorporateProfile.findFirst({
      where: {
        patientProfileId,
        deletedAt: null,
        status: 'ACTIVE',
      },
    });
  }

  async upsertCorporateProfile(
    userId: string,
    dto: UpsertPatientCorporateProfileDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const company = this.normalizeText(dto.company);
    const employeeNumber = this.normalizeEmployeeNumber(dto.employeeNumber);
    const corporatePlan = this.normalizeOptionalText(dto.corporatePlan);

    const existing = await this.database.client.patientCorporateProfile.findFirst({
      where: {
        patientProfileId,
        deletedAt: null,
      },
    });

    const now = new Date();

    if (!existing) {
      const created = await this.database.client.$transaction(async (tx) => {
        const record = await tx.patientCorporateProfile.create({
          data: {
            patientProfileId,
            company,
            employeeNumber,
            corporatePlan,
            eligibilityInformation: dto.eligibilityInformation
              ? (dto.eligibilityInformation as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            status: 'ACTIVE',
            source: PatientDataSource.PATIENT,
            createdByUserId: userId,
            updatedByUserId: userId,
          },
        });

        await tx.auditEvent.create({
          data: {
            tenantId: null,
            actorUserId: userId,
            action: 'PATIENT_CORPORATE_PROFILE_CREATED',
            resourceType: 'PatientCorporateProfile',
            resourceId: record.id,
            outcome: 'SUCCESS',
            metadata: {
              patientProfileId,
              source: PatientDataSource.PATIENT,
            },
          },
        });

        return record;
      });

      return created;
    }

    const changedFields: string[] = [];

    if (existing.company !== company) changedFields.push('company');
    if (existing.employeeNumber !== employeeNumber) {
      changedFields.push('employeeNumber');
    }
    if (existing.corporatePlan !== corporatePlan) {
      changedFields.push('corporatePlan');
    }

    const eligibilityChanged =
      JSON.stringify(existing.eligibilityInformation ?? null) !==
      JSON.stringify(dto.eligibilityInformation ?? null);

    if (eligibilityChanged) {
      changedFields.push('eligibilityInformation');
    }

    if (changedFields.length === 0) {
      return existing;
    }

    const updated = await this.database.client.$transaction(async (tx) => {
      const record = await tx.patientCorporateProfile.update({
        where: {
          id: existing.id,
        },
        data: {
          company,
          employeeNumber,
          corporatePlan,
          eligibilityInformation: dto.eligibilityInformation
              ? (dto.eligibilityInformation as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          source: PatientDataSource.PATIENT,
          updatedByUserId: userId,
          updatedAt: now,
        },
      });

      await tx.auditEvent.create({
        data: {
          tenantId: null,
          actorUserId: userId,
          action: 'PATIENT_CORPORATE_PROFILE_UPDATED',
          resourceType: 'PatientCorporateProfile',
          resourceId: record.id,
          outcome: 'SUCCESS',
          metadata: {
            patientProfileId,
            changedFields,
            source: PatientDataSource.PATIENT,
          },
        },
      });

      return record;
    });

    return updated;
  }

  async deleteCorporateProfile(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing =
      await this.database.client.patientCorporateProfile.findFirst({
        where: {
          patientProfileId,
          deletedAt: null,
        },
      });

    if (!existing) {
      throw new NotFoundException('Corporate profile not found.');
    }

    const deleted = await this.database.client.$transaction(async (tx) => {
      const record = await tx.patientCorporateProfile.update({
        where: {
          id: existing.id,
        },
        data: {
          status: 'ARCHIVED',
          deletedAt: new Date(),
          updatedByUserId: userId,
        },
      });

      await tx.auditEvent.create({
        data: {
          tenantId: null,
          actorUserId: userId,
          action: 'PATIENT_CORPORATE_PROFILE_DELETED',
          resourceType: 'PatientCorporateProfile',
          resourceId: record.id,
          outcome: 'SUCCESS',
          metadata: {
            patientProfileId,
            source: PatientDataSource.PATIENT,
          },
        },
      });

      return record;
    });

    return deleted;
  }
}
