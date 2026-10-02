import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdentityType, RecordStatus } from '@prisma/client';
import { DatabaseService } from '../../../database/database.service.js';
import { PasswordService } from './password.service.js';

@Injectable()
export class CredentialProvisioningService {
  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
  ) {}

  async setPasswordCredential(
    userId: string,
    identityType: IdentityType,
    identifier: string,
    password: string,
  ) {
    if (
      identityType !== IdentityType.EMAIL &&
      identityType !== IdentityType.PHONE
    ) {
      throw new ConflictException(
        'Password credentials require an email or phone identity',
      );
    }

    const user = await this.database.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (
      !user ||
      user.status !== RecordStatus.ACTIVE ||
      user.deletedAt !== null
    ) {
      throw new NotFoundException('User not found');
    }

    const normalizedValue = this.normalizeIdentifier(
      identityType,
      identifier,
    );

    const existingIdentity =
      await this.database.client.identity.findUnique({
        where: {
          type_normalizedValue: {
            type: identityType,
            normalizedValue,
          },
        },
        select: {
          id: true,
          userId: true,
          status: true,
        },
      });

    if (existingIdentity && existingIdentity.userId !== userId) {
      throw new ConflictException(
        'Identity is already associated with another user',
      );
    }

    const credentialHash =
      await this.passwordService.hash(password);

    const identity = existingIdentity
      ? await this.database.client.identity.update({
          where: { id: existingIdentity.id },
          data: {
            credentialHash,
            status: RecordStatus.ACTIVE,
          },
          select: {
            id: true,
            type: true,
            normalizedValue: true,
            verifiedAt: true,
            status: true,
          },
        })
      : await this.database.client.identity.create({
          data: {
            userId,
            type: identityType,
            value: identifier.trim(),
            normalizedValue,
            credentialHash,
          },
          select: {
            id: true,
            type: true,
            normalizedValue: true,
            verifiedAt: true,
            status: true,
          },
        });

    return identity;
  }

  private normalizeIdentifier(
    type: IdentityType,
    identifier: string,
  ): string {
    const value = identifier.trim();

    switch (type) {
      case IdentityType.EMAIL:
        return value.toLowerCase();

      case IdentityType.PHONE:
        return value.replace(/[^\d+]/g, '');

      default:
        return value;
    }
  }
}
