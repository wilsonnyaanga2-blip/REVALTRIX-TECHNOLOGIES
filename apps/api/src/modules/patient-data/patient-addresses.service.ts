import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PatientDataSource,
  Prisma,
  RecordStatus,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service.js';
import { CreatePatientAddressDto } from './dto/create-patient-address.dto.js';
import { UpdatePatientAddressDto } from './dto/update-patient-address.dto.js';

@Injectable()
export class PatientAddressesService {
  constructor(private readonly database: DatabaseService) {}

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
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

  private normalizeCreateDto(dto: CreatePatientAddressDto) {
    return {
      county: this.normalizeText(dto.county),
      town: this.normalizeText(dto.town),
      area: this.normalizeOptionalText(dto.area),
      physicalAddress: this.normalizeText(dto.physicalAddress),
      postalAddress: this.normalizeOptionalText(dto.postalAddress),
      isPrimary: dto.isPrimary ?? false,
    };
  }

  private normalizeUpdateDto(dto: UpdatePatientAddressDto) {
    return {
      county:
        dto.county !== undefined
          ? this.normalizeText(dto.county)
          : undefined,
      town:
        dto.town !== undefined
          ? this.normalizeText(dto.town)
          : undefined,
      area:
        dto.area !== undefined
          ? this.normalizeOptionalText(dto.area)
          : undefined,
      physicalAddress:
        dto.physicalAddress !== undefined
          ? this.normalizeText(dto.physicalAddress)
          : undefined,
      postalAddress:
        dto.postalAddress !== undefined
          ? this.normalizeOptionalText(dto.postalAddress)
          : undefined,
      isPrimary: dto.isPrimary,
    };
  }

  private async clearPrimaryAddresses(
    tx: Prisma.TransactionClient,
    patientProfileId: string,
    excludeAddressId?: string,
  ) {
    await tx.patientAddress.updateMany({
      where: {
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
        isPrimary: true,
        ...(excludeAddressId
          ? { id: { not: excludeAddressId } }
          : {}),
      },
      data: {
        isPrimary: false,
      },
    });
  }

  async listMyAddresses(userId: string) {
    const patientProfileId = await this.getPatientProfileId(userId);

    return this.database.client.patientAddress.findMany({
      where: {
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
      select: {
        id: true,
        county: true,
        town: true,
        area: true,
        physicalAddress: true,
        postalAddress: true,
        isPrimary: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMyAddress(
    userId: string,
    dto: CreatePatientAddressDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);
    const data = this.normalizeCreateDto(dto);

    if (
      !data.county ||
      !data.town ||
      !data.physicalAddress
    ) {
      throw new BadRequestException(
        'County, town, and physical address are required.',
      );
    }

    return this.database.client.$transaction(async (tx) => {
      if (data.isPrimary) {
        await this.clearPrimaryAddresses(tx, patientProfileId);
      }

      const address = await tx.patientAddress.create({
        data: {
          patientProfileId,
          county: data.county,
          town: data.town,
          area: data.area,
          physicalAddress: data.physicalAddress,
          postalAddress: data.postalAddress,
          isPrimary: data.isPrimary,
          status: RecordStatus.ACTIVE,
          source: PatientDataSource.PATIENT,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          county: true,
          town: true,
          area: true,
          physicalAddress: true,
          postalAddress: true,
          isPrimary: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_ADDRESS_CREATED',
          resourceType: 'PatientAddress',
          resourceId: address.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
            isPrimary: data.isPrimary,
          },
        },
      });

      return address;
    });
  }

  async updateMyAddress(
    userId: string,
    addressId: string,
    dto: UpdatePatientAddressDto,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.patientAddress.findFirst({
      where: {
        id: addressId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient address not found.');
    }

    const data = this.normalizeUpdateDto(dto);

    const county = data.county ?? existing.county;
    const town = data.town ?? existing.town;
    const area =
      data.area !== undefined ? data.area : existing.area;
    const physicalAddress =
      data.physicalAddress ?? existing.physicalAddress;
    const postalAddress =
      data.postalAddress !== undefined
        ? data.postalAddress
        : existing.postalAddress;
    const isPrimary = data.isPrimary ?? existing.isPrimary;

    if (!county || !town || !physicalAddress) {
      throw new BadRequestException(
        'County, town, and physical address are required.',
      );
    }

    const changedFields: string[] = [];

    if (existing.county !== county) changedFields.push('county');
    if (existing.town !== town) changedFields.push('town');
    if (existing.area !== area) changedFields.push('area');
    if (existing.physicalAddress !== physicalAddress) {
      changedFields.push('physicalAddress');
    }
    if (existing.postalAddress !== postalAddress) {
      changedFields.push('postalAddress');
    }
    if (existing.isPrimary !== isPrimary) {
      changedFields.push('isPrimary');
    }

    return this.database.client.$transaction(async (tx) => {
      if (isPrimary) {
        await this.clearPrimaryAddresses(
          tx,
          patientProfileId,
          addressId,
        );
      }

      const address = await tx.patientAddress.update({
        where: {
          id: addressId,
        },
        data: {
          county,
          town,
          area,
          physicalAddress,
          postalAddress,
          isPrimary,
          source: PatientDataSource.PATIENT,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          county: true,
          town: true,
          area: true,
          physicalAddress: true,
          postalAddress: true,
          isPrimary: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_ADDRESS_UPDATED',
          resourceType: 'PatientAddress',
          resourceId: address.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
            changedFields,
          },
        },
      });

      return address;
    });
  }

  async setPrimaryAddress(
    userId: string,
    addressId: string,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.patientAddress.findFirst({
      where: {
        id: addressId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        isPrimary: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient address not found.');
    }

    if (existing.isPrimary) {
      return {
        success: true,
        id: addressId,
        isPrimary: true,
      };
    }

    return this.database.client.$transaction(async (tx) => {
      await this.clearPrimaryAddresses(
        tx,
        patientProfileId,
        addressId,
      );

      const address = await tx.patientAddress.update({
        where: {
          id: addressId,
        },
        data: {
          isPrimary: true,
          source: PatientDataSource.PATIENT,
          updatedByUserId: userId,
        },
        select: {
          id: true,
          county: true,
          town: true,
          area: true,
          physicalAddress: true,
          postalAddress: true,
          isPrimary: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_ADDRESS_SET_PRIMARY',
          resourceType: 'PatientAddress',
          resourceId: address.id,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
          },
        },
      });

      return address;
    });
  }

  async deleteMyAddress(
    userId: string,
    addressId: string,
  ) {
    const patientProfileId = await this.getPatientProfileId(userId);

    const existing = await this.database.client.patientAddress.findFirst({
      where: {
        id: addressId,
        patientProfileId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        isPrimary: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient address not found.');
    }

    const deletedAt = new Date();

    await this.database.client.$transaction(async (tx) => {
      await tx.patientAddress.update({
        where: {
          id: addressId,
        },
        data: {
          status: RecordStatus.ARCHIVED,
          deletedAt,
          isPrimary: false,
          updatedByUserId: userId,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'PATIENT_ADDRESS_DELETED',
          resourceType: 'PatientAddress',
          resourceId: addressId,
          outcome: 'SUCCESS',
          metadata: {
            source: PatientDataSource.PATIENT,
            wasPrimary: existing.isPrimary,
          },
        },
      });
    });

    return {
      success: true,
      id: addressId,
    };
  }
}
