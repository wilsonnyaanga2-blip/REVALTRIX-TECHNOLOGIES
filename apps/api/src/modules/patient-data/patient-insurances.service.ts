import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PatientDataSource,
  RecordStatus,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service.js';
import { CreatePatientInsuranceDto } from './dto/create-patient-insurance.dto.js';
import { UpdatePatientInsuranceDto } from './dto/update-patient-insurance.dto.js';

@Injectable()
export class PatientInsurancesService {
  constructor(private readonly database: DatabaseService) {}

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeIdentifier(value: string): string {
    return value.trim().replace(/\s+/g, '').toUpperCase();
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = this.normalizeText(value);
    return normalized.length > 0 ? normalized : null;
  }

  private async getPatientProfileId(userId: string): Promise<string> {
    const profile = await this.database.client.patientProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'No patient profile is associated with the authenticated user.',
      );
    }

    return profile.id;
  }

  private validateDates(
    validFrom: Date | null | undefined,
    validUntil: Date | null | undefined,
  ) {
    if (validFrom && validUntil && validUntil < validFrom) {
      throw new BadRequestException(
        'Insurance validity end date cannot be before the start date.',
      );
    }
  }

  async listMyInsurance(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    return this.database.client.patientInsurance.findMany({
      where: {
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        provider: true,
        memberNumber: true,
        policyNumber: true,
        principalMember: true,
        relationshipToPrincipal: true,
        validFrom: true,
        validUntil: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMyInsurance(
    userId: string,
    dto: CreatePatientInsuranceDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const provider = this.normalizeText(dto.provider);
    const memberNumber = this.normalizeIdentifier(dto.memberNumber);
    const policyNumber =
      dto.policyNumber !== undefined
        ? this.normalizeIdentifier(dto.policyNumber)
        : null;
    const principalMember =
      this.normalizeOptionalText(dto.principalMember);
    const relationshipToPrincipal =
      this.normalizeOptionalText(dto.relationshipToPrincipal);

    const validFrom = dto.validFrom
      ? new Date(dto.validFrom)
      : null;
    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : null;

    if (!provider || !memberNumber) {
      throw new BadRequestException(
        'Insurance provider and member number are required.',
      );
    }

    this.validateDates(validFrom, validUntil);

    const existing = await this.database.client.patientInsurance.findMany({
      where: {
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        provider: true,
        memberNumber: true,
        policyNumber: true,
      },
    });

    const duplicate = existing.some(
      (record) =>
        this.normalizeText(record.provider).toLowerCase() ===
          provider.toLowerCase() &&
        record.memberNumber !== null && this.normalizeIdentifier(record.memberNumber) === memberNumber &&
        (record.policyNumber
          ? this.normalizeIdentifier(record.policyNumber)
          : null) === policyNumber,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This insurance record already exists.',
      );
    }

    return this.database.client.$transaction(async (tx) => {
      const insurance = await tx.patientInsurance.create({
        data: {
          patientProfileId,
          provider,
          memberNumber,
          policyNumber,
          principalMember,
          relationshipToPrincipal,
          validFrom,
          validUntil,
          status: RecordStatus.ACTIVE,
          source: PatientDataSource.PATIENT,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          provider: true,
          memberNumber: true,
          policyNumber: true,
          principalMember: true,
          relationshipToPrincipal: true,
          validFrom: true,
          validUntil: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_INSURANCE_CREATED',
          resourceType: 'PatientInsurance',
          resourceId: insurance.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });

      return insurance;
    });
  }

  async updateMyInsurance(
    userId: string,
    insuranceId: string,
    dto: UpdatePatientInsuranceDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing =
      await this.database.client.patientInsurance.findFirst({
        where: {
          id: insuranceId,
          patientProfileId,
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
      });

    if (!existing) {
      throw new NotFoundException('Patient insurance record not found.');
    }

    const provider =
      dto.provider !== undefined
        ? this.normalizeText(dto.provider)
        : existing.provider;

    const memberNumber =
      dto.memberNumber !== undefined
        ? this.normalizeIdentifier(dto.memberNumber)
        : existing.memberNumber;

    const policyNumber =
      dto.policyNumber !== undefined
        ? this.normalizeOptionalText(dto.policyNumber)
        : existing.policyNumber;

    const principalMember =
      dto.principalMember !== undefined
        ? this.normalizeOptionalText(dto.principalMember)
        : existing.principalMember;

    const relationshipToPrincipal =
      dto.relationshipToPrincipal !== undefined
        ? this.normalizeOptionalText(dto.relationshipToPrincipal)
        : existing.relationshipToPrincipal;

    const validFrom =
      dto.validFrom !== undefined
        ? new Date(dto.validFrom)
        : existing.validFrom;

    const validUntil =
      dto.validUntil !== undefined
        ? new Date(dto.validUntil)
        : existing.validUntil;

    if (!provider || !memberNumber) {
      throw new BadRequestException(
        'Insurance provider and member number are required.',
      );
    }

    this.validateDates(validFrom, validUntil);

    const otherRecords =
      await this.database.client.patientInsurance.findMany({
        where: {
          patientProfileId,
          id: { not: insuranceId },
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          provider: true,
          memberNumber: true,
          policyNumber: true,
        },
      });

    const duplicate = otherRecords.some(
      (record) =>
        this.normalizeText(record.provider).toLowerCase() ===
          provider.toLowerCase() &&
        record.memberNumber !== null && this.normalizeIdentifier(record.memberNumber) === memberNumber &&
        (record.policyNumber
          ? this.normalizeIdentifier(record.policyNumber)
          : null) === policyNumber,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This insurance record already exists.',
      );
    }

    const changedFields: string[] = [];

    if (existing.provider !== provider) changedFields.push('provider');
    if (existing.memberNumber !== memberNumber) {
      changedFields.push('memberNumber');
    }
    if (existing.policyNumber !== policyNumber) {
      changedFields.push('policyNumber');
    }
    if (existing.principalMember !== principalMember) {
      changedFields.push('principalMember');
    }
    if (existing.relationshipToPrincipal !== relationshipToPrincipal) {
      changedFields.push('relationshipToPrincipal');
    }
    if (
      existing.validFrom?.getTime() !== validFrom?.getTime()
    ) {
      changedFields.push('validFrom');
    }
    if (
      existing.validUntil?.getTime() !== validUntil?.getTime()
    ) {
      changedFields.push('validUntil');
    }

    return this.database.client.$transaction(async (tx) => {
      const insurance = await tx.patientInsurance.update({
        where: {
          id: insuranceId,
        },
        data: {
          provider,
          memberNumber,
          policyNumber,
          principalMember,
          relationshipToPrincipal,
          validFrom,
          validUntil,
          source: PatientDataSource.PATIENT,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          provider: true,
          memberNumber: true,
          policyNumber: true,
          principalMember: true,
          relationshipToPrincipal: true,
          validFrom: true,
          validUntil: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_INSURANCE_UPDATED',
          resourceType: 'PatientInsurance',
          resourceId: insurance.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
            changedFields,
          },
        },
      });

      return insurance;
    });
  }

  async deleteMyInsurance(
    userId: string,
    insuranceId: string,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing =
      await this.database.client.patientInsurance.findFirst({
        where: {
          id: insuranceId,
          patientProfileId,
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      throw new NotFoundException('Patient insurance record not found.');
    }

    const deletedAt = new Date();

    await this.database.client.$transaction(async (tx) => {
      await tx.patientInsurance.update({
        where: {
          id: insuranceId,
        },
        data: {
          status: RecordStatus.ARCHIVED,
          deletedAt,
          updatedByUserId: userId,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_INSURANCE_DELETED',
          resourceType: 'PatientInsurance',
          resourceId: insuranceId,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });
    });

    return {
      success: true,
      id: insuranceId,
    };
  }
}
