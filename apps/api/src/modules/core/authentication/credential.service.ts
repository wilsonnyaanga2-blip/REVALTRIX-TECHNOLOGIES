import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IdentityType, RecordStatus } from '@prisma/client';
import { DatabaseService } from '../../../database/database.service.js';
import { PasswordService } from './password.service.js';

export interface AuthenticatedCredential {
  userId: string;
  identityId: string;
  identityType: IdentityType;
}

@Injectable()
export class CredentialService {
  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
  ) {}

  async verifyCredentials(
    type: IdentityType,
    identifier: string,
    password: string,
  ): Promise<AuthenticatedCredential> {
    const normalizedValue = this.normalizeIdentifier(type, identifier);

    const identity = await this.database.client.identity.findUnique({
      where: {
        type_normalizedValue: {
          type,
          normalizedValue,
        },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        credentialHash: true,
        status: true,
        user: {
          select: {
            id: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (
      !identity ||
      identity.status !== RecordStatus.ACTIVE ||
      identity.user.status !== RecordStatus.ACTIVE ||
      identity.user.deletedAt !== null ||
      !identity.credentialHash
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.verify(
      identity.credentialHash,
      password,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      userId: identity.userId,
      identityId: identity.id,
      identityType: identity.type,
    };
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
