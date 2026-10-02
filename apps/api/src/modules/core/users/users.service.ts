import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecordStatus } from '@prisma/client';
import { DatabaseService } from '../../../database/database.service.js';

export interface CreateUserInput {
  displayName: string;
  username?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async createUser(input: CreateUserInput) {
    const displayName = input.displayName.trim();

    if (!displayName) {
      throw new ConflictException('Display name is required');
    }

    const username = input.username?.trim().toLowerCase();

    if (username) {
      const existing = await this.database.client.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException('Username is already in use');
      }
    }

    return this.database.client.user.create({
      data: {
        displayName,
        ...(username ? { username } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(userId: string) {
    const user = await this.database.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deactivateUser(userId: string) {
    const user = await this.database.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }

    if (user.status === RecordStatus.INACTIVE) {
      return;
    }

    await this.database.client.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: RecordStatus.INACTIVE,
        },
      });

      await tx.session.updateMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });
    });
  }
}
