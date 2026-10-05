import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { UpsertPatientContactDto } from './dto/upsert-patient-contact.dto.js';

@Injectable()
export class PatientDataService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  private normalizePhone(phone?: string): string | undefined {
    if (phone === undefined) {
      return undefined;
    }

    const normalized = phone.trim().replace(/[^\d+]/g, '');

    if (!normalized) {
      return undefined;
    }

    return normalized;
  }

  private normalizeEmail(email?: string): string | undefined {
    if (email === undefined) {
      return undefined;
    }

    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      return undefined;
    }

    return normalized;
  }

  private async getPatientProfileId(userId: string): Promise<string> {
    const patient = await this.database.client.patientProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Authenticated user is not a Revaltrix patient',
      );
    }

    return patient.id;
  }

  async getMyContact(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const contact = await this.database.client.patientContact.findFirst({
      where: {
        patientProfileId,
        deletedAt: null,
      },
      select: {
        id: true,
        phone: true,
        alternativePhone: true,
        email: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: contact,
    };
  }

  async upsertMyContact(
    userId: string,
    dto: UpsertPatientContactDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const phone = this.normalizePhone(dto.phone);
    const alternativePhone = this.normalizePhone(dto.alternativePhone);
    const email = this.normalizeEmail(dto.email);

    if (!phone && !alternativePhone && !email) {
      throw new BadRequestException(
        'At least one contact method is required',
      );
    }

    const existing =
      await this.database.client.patientContact.findUnique({
        where: {
          patientProfileId,
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });

    const now = new Date();

    const contact =
      await this.database.client.$transaction(async (tx) => {
        const result = existing
          ? await tx.patientContact.update({
              where: {
                id: existing.id,
              },
              data: {
                phone: phone ?? null,
                alternativePhone: alternativePhone ?? null,
                email: email ?? null,
                status: 'ACTIVE',
                source: 'PATIENT',
                updatedByUserId: userId,
                deletedAt: null,
              },
              select: {
                id: true,
                phone: true,
                alternativePhone: true,
                email: true,
                status: true,
                source: true,
                createdAt: true,
                updatedAt: true,
              },
            })
          : await tx.patientContact.create({
              data: {
                patientProfileId,
                phone: phone ?? null,
                alternativePhone: alternativePhone ?? null,
                email: email ?? null,
                status: 'ACTIVE',
                source: 'PATIENT',
                createdByUserId: userId,
                updatedByUserId: userId,
              },
              select: {
                id: true,
                phone: true,
                alternativePhone: true,
                email: true,
                status: true,
                source: true,
                createdAt: true,
                updatedAt: true,
              },
            });

        await tx.auditEvent.create({
          data: {
            tenantId: null,
            actorUserId: userId,
            action: existing
              ? 'PATIENT_CONTACT_UPDATED'
              : 'PATIENT_CONTACT_CREATED',
            resourceType: 'PATIENT_CONTACT',
            resourceId: result.id,
            outcome: 'SUCCESS',
            reason: existing
              ? 'Patient updated their contact information'
              : 'Patient created their contact information',
            metadata: {
              patientProfileId,
              source: 'PATIENT',
              changedFields: [
                ...(dto.phone !== undefined ? ['phone'] : []),
                ...(dto.alternativePhone !== undefined
                  ? ['alternativePhone']
                  : []),
                ...(dto.email !== undefined ? ['email'] : []),
              ],
            },
          },
        });

        return result;
      });

    return {
      data: contact,
    };
  }

  async deleteMyContact(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const contact =
      await this.database.client.patientContact.findFirst({
        where: {
          patientProfileId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!contact) {
      throw new NotFoundException(
        'Patient contact information was not found',
      );
    }

    const now = new Date();

    await this.database.client.$transaction(async (tx) => {
      await tx.patientContact.update({
        where: {
          id: contact.id,
        },
        data: {
          status: 'ARCHIVED',
          deletedAt: now,
          updatedByUserId: userId,
        },
      });

      await tx.auditEvent.create({
        data: {
          tenantId: null,
          actorUserId: userId,
          action: 'PATIENT_CONTACT_DELETED',
          resourceType: 'PATIENT_CONTACT',
          resourceId: contact.id,
          outcome: 'SUCCESS',
          reason: 'Patient removed their contact information',
          metadata: {
            patientProfileId,
            source: 'PATIENT',
          },
        },
      });
    });

    return {
      deleted: true,
      contactId: contact.id,
    };
  }
}
