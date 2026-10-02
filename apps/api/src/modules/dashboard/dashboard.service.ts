import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { TenantSetupService } from '../tenant-setup/tenant-setup.service.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly database: DatabaseService,
    private readonly tenantSetupService: TenantSetupService,
  ) {}

  async getDashboard(userId: string) {
    const membership = await this.getActiveMembership(userId);

    if (!membership) {
      throw new NotFoundException(
        'Active tenant membership not found',
      );
    }

    const user = await this.database.client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Authenticated user not found',
      );
    }

    const tenant = membership.tenant;

    const [
      branchCount,
      departmentCount,
      serviceCount,
      activeMemberCount,
      patientCount,
    ] = await Promise.all([
      this.database.client.branch.count({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.database.client.department.count({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.database.client.service.count({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.database.client.membership.count({
        where: {
          tenantId: tenant.id,
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
        },
      }),
      this.database.client.patientTenantRecord.count({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
    ]);

    const setup = await this.tenantSetupService.getSetup(
      userId,
    );

    return {
      user: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        status: user.status,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        legalName: tenant.legalName,
        type: tenant.type,
        status: tenant.status,
      },
      membership: {
        id: membership.id,
        branch: membership.branch,
        department: membership.department,
        roles: membership.roles.map(
          (membershipRole) => membershipRole.role,
        ),
      },
      setup: {
        status: setup.setup.status,
        readinessPercent: setup.setup.readinessPercent,
        readyAt: setup.setup.readyAt,
        liveAt: setup.setup.liveAt,
      },
      summary: {
        branches: branchCount,
        departments: departmentCount,
        services: serviceCount,
        activeMembers: activeMemberCount,
        patients: patientCount,
      },
      capabilities: {
        patients: 'AVAILABLE',
        appointments: 'NOT_IMPLEMENTED',
        providers: 'NOT_IMPLEMENTED',
        encounters: 'NOT_IMPLEMENTED',
        queue: 'NOT_IMPLEMENTED',
        billing: 'NOT_IMPLEMENTED',
      },
    };
  }

  async getHospitalDashboard(userId: string) {
    const dashboard = await this.getDashboard(userId);

    if (dashboard.tenant.type !== 'HOSPITAL') {
      throw new NotFoundException(
        'Hospital dashboard is only available to hospital organizations',
      );
    }

    return dashboard;
  }

  private async getActiveMembership(userId: string) {
    const now = new Date();

    return this.database.client.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        startsAt: {
          lte: now,
        },
        OR: [
          {
            endsAt: null,
          },
          {
            endsAt: {
              gt: now,
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
        tenant: {
          select: {
            id: true,
            name: true,
            legalName: true,
            type: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                scope: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
