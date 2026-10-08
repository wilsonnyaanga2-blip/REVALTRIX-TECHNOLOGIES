import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type {
  AuthorizationContext,
  RequiredPermission,
} from './types/authorization.types.js';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async getContext(
    userId: string,
  ): Promise<AuthorizationContext> {
    const now = new Date();

    const membership =
      await this.database.client.membership.findFirst({
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
          tenantId: true,
          branchId: true,
          departmentId: true,
          roles: {
            where: {
              role: {
                status: 'ACTIVE',
              },
            },
            select: {
              roleId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Active tenant membership not found',
      );
    }

    return {
      userId,
      membershipId: membership.id,
      tenantId: membership.tenantId,
      branchId: membership.branchId,
      departmentId: membership.departmentId,
      roleIds: membership.roles.map(
        (membershipRole) => membershipRole.roleId,
      ),
    };
  }

  async hasPermission(
    userId: string,
    required: RequiredPermission,
  ): Promise<boolean> {
    const context = await this.getContext(userId);

    if (context.roleIds.length === 0) {
      return false;
    }

    const permissions =
      await this.database.client.permission.findMany({
        where: {
          resource: required.resource,
          action: required.action,
          scope: 'TENANT',
          status: 'ACTIVE',
          OR: [
            { tenantId: null },
            { tenantId: context.tenantId },
          ],
          roles: {
            some: {
              roleId: {
                in: context.roleIds,
              },
            },
          },
        },
        select: {
          effect: true,
        },
      });

    if (
      permissions.some(
        (permission) => permission.effect === 'DENY',
      )
    ) {
      return false;
    }

    return permissions.some(
      (permission) => permission.effect === 'ALLOW',
    );
  }

  async assertPermission(
    userId: string,
    required: RequiredPermission,
  ): Promise<AuthorizationContext> {
    const context = await this.getContext(userId);

    if (context.roleIds.length === 0) {
      throw new ForbiddenException(
        'No active role is assigned to this membership',
      );
    }

    const permissions =
      await this.database.client.permission.findMany({
        where: {
          resource: required.resource,
          action: required.action,
          scope: 'TENANT',
          status: 'ACTIVE',
          OR: [
            {
              tenantId: null,
            },
            {
              tenantId: context.tenantId,
            },
          ],
          roles: {
            some: {
              roleId: {
                in: context.roleIds,
              },
            },
          },
        },
        select: {
          effect: true,
        },
      });

    if (
      permissions.some(
        (permission) => permission.effect === 'DENY',
      )
    ) {
      throw new ForbiddenException(
        'Permission denied',
      );
    }

    if (
      !permissions.some(
        (permission) => permission.effect === 'ALLOW',
      )
    ) {
      throw new ForbiddenException(
        'Permission denied',
      );
    }

    return context;
  }

  async hasPlatformPermission(
    userId: string,
    required: RequiredPermission,
  ): Promise<boolean> {
    const permissions =
      await this.database.client.permission.findMany({
        where: {
          resource: required.resource,
          action: required.action,
          scope: 'PLATFORM',
          tenantId: null,
          status: 'ACTIVE',
          roles: {
            some: {
              role: {
                tenantId: null,
                scope: 'PLATFORM',
                status: 'ACTIVE',
                platformAssignments: {
                  some: {
                    userId,
                  },
                },
              },
            },
          },
        },
        select: {
          effect: true,
        },
      });

    if (
      permissions.some(
        (permission) => permission.effect === 'DENY',
      )
    ) {
      return false;
    }

    return permissions.some(
      (permission) => permission.effect === 'ALLOW',
    );
  }

  async assertPlatformPermission(
    userId: string,
    required: RequiredPermission,
  ): Promise<void> {
    const permissions =
      await this.database.client.permission.findMany({
        where: {
          resource: required.resource,
          action: required.action,
          scope: 'PLATFORM',
          tenantId: null,
          status: 'ACTIVE',
          roles: {
            some: {
              role: {
                tenantId: null,
                scope: 'PLATFORM',
                status: 'ACTIVE',
                platformAssignments: {
                  some: {
                    userId,
                  },
                },
              },
            },
          },
        },
        select: {
          effect: true,
        },
      });

    if (
      permissions.some(
        (permission) => permission.effect === 'DENY',
      )
    ) {
      throw new ForbiddenException(
        'Platform permission denied',
      );
    }

    if (
      !permissions.some(
        (permission) => permission.effect === 'ALLOW',
      )
    ) {
      throw new ForbiddenException(
        'Platform permission denied',
      );
    }
  }
}