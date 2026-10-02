import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../../database/database.service.js';

@Injectable()
export class SessionService {
  constructor(private readonly database: DatabaseService) {}

  async createSessionInTransaction(
    transaction: Prisma.TransactionClient,
    userId: string,
    deviceId?: string,
  ) {
    if (deviceId) {
      const device = await transaction.device.findFirst({
        where: {
          id: deviceId,
          userId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });

      if (!device) {
        throw new UnauthorizedException('Invalid device');
      }
    }

    const refreshToken = randomBytes(64).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await transaction.session.create({
      data: {
        userId,
        deviceId: deviceId ?? null,
        tokenHash,
        expiresAt,
      },
    });

    return {
      sessionId: session.id,
      refreshToken,
      expiresAt: session.expiresAt,
    };
  }

  async createSession(userId: string, deviceId?: string) {
    if (deviceId) {
      const device = await this.database.client.device.findFirst({
        where: {
          id: deviceId,
          userId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });

      if (!device) {
        throw new UnauthorizedException('Invalid device');
      }
    }

    const refreshToken = randomBytes(64).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await this.database.client.session.create({
      data: {
        userId,
        deviceId: deviceId ?? null,
        tokenHash,
        expiresAt,
      },
    });

    return {
      sessionId: session.id,
      refreshToken,
      expiresAt: session.expiresAt,
    };
  }

  async rotateRefreshToken(sessionId: string, refreshToken: string) {
    const session = await this.database.client.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!session || session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt <= new Date()) {
      await this.revokeSession(sessionId);
      throw new UnauthorizedException('Session expired');
    }

    const suppliedHash = this.hashToken(refreshToken);

    if (suppliedHash !== session.tokenHash) {
      await this.revokeSession(sessionId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextRefreshToken = randomBytes(64).toString('base64url');
    const nextHash = this.hashToken(nextRefreshToken);

    const updated = await this.database.client.session.updateMany({
      where: {
        id: sessionId,
        status: 'ACTIVE',
        tokenHash: suppliedHash,
      },
      data: {
        tokenHash: nextHash,
        lastActivityAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      refreshToken: nextRefreshToken,
      expiresAt: session.expiresAt,
    };
  }

  async findActiveSession(sessionId: string) {
    const session = await this.database.client.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (
      !session ||
      session.status !== 'ACTIVE' ||
      session.expiresAt <= new Date()
    ) {
      return null;
    }

    return session;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.database.client.session.updateMany({
      where: {
        id: sessionId,
        status: 'ACTIVE',
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
