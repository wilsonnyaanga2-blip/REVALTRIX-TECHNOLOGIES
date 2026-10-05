import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PatientDataSource, RecordStatus } from '@prisma/client';
import { DatabaseService } from '../../database/database.service.js';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';

@Injectable()
export class EmergencyContactsService {
  constructor(private readonly database: DatabaseService) {}

  private normalizePhone(value: string): string {
    return value.trim().replace(/(?!^)\D/g, '');
  }

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
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

  private normalizeDto(
    dto: CreateEmergencyContactDto | UpdateEmergencyContactDto,
  ) {
    return {
      name:
        dto.name !== undefined ? this.normalizeText(dto.name) : undefined,
      relationship:
        dto.relationship !== undefined
          ? this.normalizeText(dto.relationship)
          : undefined,
      phone:
        dto.phone !== undefined ? this.normalizePhone(dto.phone) : undefined,
      alternativePhone:
        dto.alternativePhone !== undefined
          ? this.normalizePhone(dto.alternativePhone)
          : undefined,
    };
  }

  async listMyEmergencyContacts(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    return this.database.client.emergencyContact.findMany({
      where: {
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        relationship: true,
        phone: true,
        alternativePhone: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMyEmergencyContact(
    userId: string,
    dto: CreateEmergencyContactDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);
    const data = this.normalizeDto(dto);

    if (!data.name || !data.relationship || !data.phone) {
      throw new BadRequestException(
        'Name, relationship, and phone are required.',
      );
    }

    if (
      data.alternativePhone !== undefined &&
      data.alternativePhone === data.phone
    ) {
      throw new BadRequestException(
        'Alternative phone must be different from the primary phone.',
      );
    }

    const existingContacts =
      await this.database.client.emergencyContact.findMany({
        where: {
          patientProfileId,
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          name: true,
          relationship: true,
          phone: true,
          alternativePhone: true,
        },
      });

    const duplicate = existingContacts.some(
      (contact) =>
        this.normalizeText(contact.name).toLowerCase() ===
          data.name!.toLowerCase() &&
        this.normalizeText(contact.relationship).toLowerCase() ===
          data.relationship!.toLowerCase() &&
        this.normalizePhone(contact.phone) === data.phone,
    );

    if (duplicate) {
      throw new BadRequestException(
        'An emergency contact with the same name, relationship, and phone already exists.',
      );
    }

    return this.database.client.$transaction(async (tx) => {
      const contact = await tx.emergencyContact.create({
        data: {
          patientProfileId,
          name: data.name!,
          relationship: data.relationship!,
          phone: data.phone!,
          alternativePhone: data.alternativePhone ?? null,
          status: RecordStatus.ACTIVE,
          source: PatientDataSource.PATIENT,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          name: true,
          relationship: true,
          phone: true,
          alternativePhone: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'EMERGENCY_CONTACT_CREATED',
          resourceType: 'EmergencyContact',
          resourceId: contact.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });

      return contact;
    });
  }

  async updateMyEmergencyContact(
    userId: string,
    contactId: string,
    dto: UpdateEmergencyContactDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.emergencyContact.findFirst({
      where: {
        id: contactId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Emergency contact not found.');
    }

    const data = this.normalizeDto(dto);

    const name = data.name ?? existing.name;
    const relationship = data.relationship ?? existing.relationship;
    const phone = data.phone ?? existing.phone;
    const alternativePhone =
      data.alternativePhone !== undefined
        ? data.alternativePhone
        : existing.alternativePhone;

    if (
      alternativePhone !== null &&
      alternativePhone !== undefined &&
      alternativePhone === phone
    ) {
      throw new BadRequestException(
        'Alternative phone must be different from the primary phone.',
      );
    }

    const otherContacts =
      await this.database.client.emergencyContact.findMany({
        where: {
          patientProfileId,
          id: { not: contactId },
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          name: true,
          relationship: true,
          phone: true,
        },
      });

    const duplicate = otherContacts.some(
      (contact) =>
        this.normalizeText(contact.name).toLowerCase() ===
          this.normalizeText(name).toLowerCase() &&
        this.normalizeText(contact.relationship).toLowerCase() ===
          this.normalizeText(relationship).toLowerCase() &&
        this.normalizePhone(contact.phone) === this.normalizePhone(phone),
    );

    if (duplicate) {
      throw new BadRequestException(
        'An emergency contact with the same name, relationship, and phone already exists.',
      );
    }

    const changedFields: string[] = [];

    if (existing.name !== name) changedFields.push('name');
    if (existing.relationship !== relationship)
      changedFields.push('relationship');
    if (existing.phone !== phone) changedFields.push('phone');
    if (existing.alternativePhone !== alternativePhone)
      changedFields.push('alternativePhone');

    return this.database.client.$transaction(async (tx) => {
      const contact = await tx.emergencyContact.update({
        where: {
          id: contactId,
        },
        data: {
          name: this.normalizeText(name),
          relationship: this.normalizeText(relationship),
          phone: this.normalizePhone(phone),
          alternativePhone:
            alternativePhone === null || alternativePhone === undefined
              ? null
              : this.normalizePhone(alternativePhone),
          source: PatientDataSource.PATIENT,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          name: true,
          relationship: true,
          phone: true,
          alternativePhone: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'EMERGENCY_CONTACT_UPDATED',
          resourceType: 'EmergencyContact',
          resourceId: contact.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
            changedFields,
          },
        },
      });

      return contact;
    });
  }

  async deleteMyEmergencyContact(userId: string, contactId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.emergencyContact.findFirst({
      where: {
        id: contactId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Emergency contact not found.');
    }

    const deletedAt = new Date();

    await this.database.client.$transaction(async (tx) => {
      await tx.emergencyContact.update({
        where: {
          id: contactId,
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
          action: 'EMERGENCY_CONTACT_DELETED',
          resourceType: 'EmergencyContact',
          resourceId: contactId,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });
    });

    return {
      success: true,
      id: contactId,
    };
  }
}
