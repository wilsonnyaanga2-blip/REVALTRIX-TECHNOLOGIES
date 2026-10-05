import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PatientDataSource, RecordStatus } from '@prisma/client';
import { DatabaseService } from '../../database/database.service.js';
import { CreateNextOfKinDto } from './dto/create-next-of-kin.dto.js';
import { UpdateNextOfKinDto } from './dto/update-next-of-kin.dto.js';

@Injectable()
export class NextOfKinService {
  constructor(private readonly database: DatabaseService) {}

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizePhone(value: string): string {
    return value.trim().replace(/\D/g, '');
  }

  private normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
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
    dto: CreateNextOfKinDto | UpdateNextOfKinDto,
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
      email:
        dto.email !== undefined ? this.normalizeEmail(dto.email) : undefined,
      address:
        dto.address !== undefined
          ? this.normalizeText(dto.address)
          : undefined,
    };
  }

  async listMyNextOfKin(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    return this.database.client.nextOfKin.findMany({
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
        email: true,
        address: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMyNextOfKin(
    userId: string,
    dto: CreateNextOfKinDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);
    const data = this.normalizeDto(dto);

    if (!data.name || !data.relationship || !data.phone) {
      throw new BadRequestException(
        'Name, relationship, and phone are required.',
      );
    }

    const existing = await this.database.client.nextOfKin.findMany({
      where: {
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        name: true,
        relationship: true,
        phone: true,
      },
    });

    const duplicate = existing.some(
      (record) =>
        this.normalizeText(record.name).toLowerCase() ===
          data.name!.toLowerCase() &&
        this.normalizeText(record.relationship).toLowerCase() ===
          data.relationship!.toLowerCase() &&
        this.normalizePhone(record.phone) === data.phone,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This next-of-kin record already exists.',
      );
    }

    return this.database.client.$transaction(async (tx) => {
      const nextOfKin = await tx.nextOfKin.create({
        data: {
          patientProfileId,
          name: data.name!,
          relationship: data.relationship!,
          phone: data.phone!,
          email: data.email ?? null,
          address: data.address ?? null,
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
          email: true,
          address: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'NEXT_OF_KIN_CREATED',
          resourceType: 'NextOfKin',
          resourceId: nextOfKin.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });

      return nextOfKin;
    });
  }

  async updateMyNextOfKin(
    userId: string,
    nextOfKinId: string,
    dto: UpdateNextOfKinDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.nextOfKin.findFirst({
      where: {
        id: nextOfKinId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Next-of-kin record not found.');
    }

    const data = this.normalizeDto(dto);

    const name = data.name ?? existing.name;
    const relationship = data.relationship ?? existing.relationship;
    const phone = data.phone ?? existing.phone;
    const email =
      data.email !== undefined ? data.email : existing.email;
    const address =
      data.address !== undefined ? data.address : existing.address;

    if (!name || !relationship || !phone) {
      throw new BadRequestException(
        'Name, relationship, and phone are required.',
      );
    }

    const otherRecords = await this.database.client.nextOfKin.findMany({
      where: {
        patientProfileId,
        id: { not: nextOfKinId },
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        name: true,
        relationship: true,
        phone: true,
      },
    });

    const duplicate = otherRecords.some(
      (record) =>
        this.normalizeText(record.name).toLowerCase() ===
          this.normalizeText(name).toLowerCase() &&
        this.normalizeText(record.relationship).toLowerCase() ===
          this.normalizeText(relationship).toLowerCase() &&
        this.normalizePhone(record.phone) ===
          this.normalizePhone(phone),
    );

    if (duplicate) {
      throw new BadRequestException(
        'This next-of-kin record already exists.',
      );
    }

    const changedFields: string[] = [];

    if (existing.name !== name) changedFields.push('name');
    if (existing.relationship !== relationship)
      changedFields.push('relationship');
    if (existing.phone !== phone) changedFields.push('phone');
    if (existing.email !== email) changedFields.push('email');
    if (existing.address !== address) changedFields.push('address');

    return this.database.client.$transaction(async (tx) => {
      const nextOfKin = await tx.nextOfKin.update({
        where: {
          id: nextOfKinId,
        },
        data: {
          name: this.normalizeText(name),
          relationship: this.normalizeText(relationship),
          phone: this.normalizePhone(phone),
          email: email === null ? null : email,
          address: address === null ? null : address,
          source: PatientDataSource.PATIENT,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          name: true,
          relationship: true,
          phone: true,
          email: true,
          address: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'NEXT_OF_KIN_UPDATED',
          resourceType: 'NextOfKin',
          resourceId: nextOfKin.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
            changedFields,
          },
        },
      });

      return nextOfKin;
    });
  }

  async deleteMyNextOfKin(
    userId: string,
    nextOfKinId: string,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.nextOfKin.findFirst({
      where: {
        id: nextOfKinId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Next-of-kin record not found.');
    }

    const deletedAt = new Date();

    await this.database.client.$transaction(async (tx) => {
      await tx.nextOfKin.update({
        where: {
          id: nextOfKinId,
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
          action: 'NEXT_OF_KIN_DELETED',
          resourceType: 'NextOfKin',
          resourceId: nextOfKinId,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });
    });

    return {
      success: true,
      id: nextOfKinId,
    };
  }
}
