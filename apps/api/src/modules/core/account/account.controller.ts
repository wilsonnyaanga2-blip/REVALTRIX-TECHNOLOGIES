import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../authentication/guards/access-token.guard.js';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard.js';
import { DatabaseService } from '../../../database/database.service.js';

@Controller('v1/core/account')
@UseGuards(AccessTokenGuard)
export class AccountController {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  @Get('me')
  async getMyAccount(
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.auth.userId;

    const [patientProfile, membership] =
      await Promise.all([
        this.database.client.patientProfile.findUnique({
          where: {
            userId,
          },
          select: {
            id: true,
            platformPatientId: true,
          },
        }),
        this.database.client.membership.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
            startsAt: {
              lte: new Date(),
            },
            OR: [
              {
                endsAt: null,
              },
              {
                endsAt: {
                  gt: new Date(),
                },
              },
            ],
            tenant: {
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
          select: {
            id: true,
            tenantId: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
      ]);

    if (patientProfile) {
      return {
        accountType: 'PATIENT' as const,
        patient: {
          profileId: patientProfile.id,
          platformPatientId: patientProfile.platformPatientId,
        },
      };
    }

    if (membership) {
      return {
        accountType: 'TENANT' as const,
        tenant: {
          membershipId: membership.id,
          tenantId: membership.tenantId,
        },
      };
    }

    return {
      accountType: 'UNASSIGNED' as const,
    };
  }
}
