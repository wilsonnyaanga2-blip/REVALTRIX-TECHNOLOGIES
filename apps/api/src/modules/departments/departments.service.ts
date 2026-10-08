import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { CreateDepartmentDto } from './dto/create-department.dto.js';
import type { UpdateDepartmentDto } from './dto/update-department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async list(userId: string) {
    const tenantId =
      await this.getTenantIdForUser(userId);

    return this.database.client.department.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        organizationId: true,
        branchId: true,
        parentId: true,
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            children: true,
            memberships: true,
            services: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        {
          name: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  async getById(
    userId: string,
    departmentId: string,
  ) {
    const tenantId =
      await this.getTenantIdForUser(userId);

    const department =
      await this.database.client.department.findFirst({
        where: {
          id: departmentId,
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          organizationId: true,
          branchId: true,
          parentId: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          children: {
            where: {
              status: 'ACTIVE',
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
          _count: {
            select: {
              children: true,
              memberships: true,
              services: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!department) {
      throw new NotFoundException(
        'Department not found',
      );
    }

    return department;
  }

  async create(
    userId: string,
    dto: CreateDepartmentDto,
  ) {
    const tenantId =
      await this.getTenantIdForUser(userId);

    const name = dto.name.trim();
    const code = dto.code.trim().toUpperCase();

    await this.ensureUniqueCode(tenantId, code);

    await this.validateReferences(
      tenantId,
      dto.organizationId,
      dto.branchId,
      dto.parentId,
    );

    return this.database.client.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: {
          tenantId,
          name,
          code,
          organizationId: dto.organizationId ?? null,
          branchId: dto.branchId ?? null,
          parentId: dto.parentId ?? null,
        },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          organizationId: true,
          branchId: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.queue.create({
        data: {
          tenantId,
          branchId: department.branchId,
          departmentId: department.id,
          name: `${department.name} Queue`,
          code: `D-${department.id}`,
          description: `Automatically managed queue for ${department.name}.`,
          status: 'ACTIVE',
        },
      });

      return department;
    });
  }

  async update(
    userId: string,
    departmentId: string,
    dto: UpdateDepartmentDto,
  ) {
    const tenantId =
      await this.getTenantIdForUser(userId);

    const existing =
      await this.database.client.department.findFirst({
        where: {
          id: departmentId,
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          code: true,
          organizationId: true,
          branchId: true,
          parentId: true,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Department not found',
      );
    }

    const organizationId =
      dto.organizationId !== undefined
        ? dto.organizationId
        : existing.organizationId;

    const branchId =
      dto.branchId !== undefined
        ? dto.branchId
        : existing.branchId;

    const parentId =
      dto.parentId !== undefined
        ? dto.parentId
        : existing.parentId;

    const data: {
      name?: string;
      code?: string;
      organizationId?: string | null;
      branchId?: string | null;
      parentId?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();

      if (code !== existing.code) {
        await this.ensureUniqueCode(
          tenantId,
          code,
        );
      }

      data.code = code;
    }

    if (dto.organizationId !== undefined) {
      data.organizationId = dto.organizationId;
    }

    if (dto.branchId !== undefined) {
      data.branchId = dto.branchId;
    }

    if (dto.parentId !== undefined) {
      data.parentId = dto.parentId;
    }

    await this.validateReferences(
      tenantId,
      organizationId,
      branchId,
      parentId,
      departmentId,
    );

    if (Object.keys(data).length === 0) {
      return this.getById(
        userId,
        departmentId,
      );
    }

    return this.database.client.$transaction(async (tx) => {
      const department = await tx.department.update({
        where: {
          id: departmentId,
        },
        data,
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          organizationId: true,
          branchId: true,
          parentId: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.queue.updateMany({
        where: {
          tenantId,
          departmentId: department.id,
          code: `D-${department.id}`,
        },
        data: {
          name: `${department.name} Queue`,
          branchId: department.branchId,
          description: `Automatically managed queue for ${department.name}.`,
        },
      });

      return department;
    });
  }

  async remove(
    userId: string,
    departmentId: string,
  ) {
    const tenantId =
      await this.getTenantIdForUser(userId);

    const department =
      await this.database.client.department.findFirst({
        where: {
          id: departmentId,
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!department) {
      throw new NotFoundException(
        'Department not found',
      );
    }

    const [childCount, serviceCount, memberCount] =
      await Promise.all([
        this.database.client.department.count({
          where: {
            tenantId,
            parentId: departmentId,
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
        this.database.client.service.count({
          where: {
            tenantId,
            departmentId,
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
        this.database.client.membership.count({
          where: {
            tenantId,
            departmentId,
            status: 'ACTIVE',
          },
        }),
      ]);

    if (
      childCount > 0 ||
      serviceCount > 0 ||
      memberCount > 0
    ) {
      throw new ConflictException(
        'Department cannot be deactivated while it has active child departments, services, or members',
      );
    }

    return this.database.client.department.update({
      where: {
        id: department.id,
      },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });
  }

  private async getTenantIdForUser(
    userId: string,
  ): Promise<string> {
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
          tenantId: true,
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

    return membership.tenantId;
  }

  private async ensureUniqueCode(
    tenantId: string,
    code: string,
  ): Promise<void> {
    const existing =
      await this.database.client.department.findFirst({
        where: {
          tenantId,
          code,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw new ConflictException(
        'A department with this code already exists',
      );
    }
  }

  private async validateReferences(
    tenantId: string,
    organizationId?: string | null,
    branchId?: string | null,
    parentId?: string | null,
    currentDepartmentId?: string,
  ): Promise<void> {
    if (organizationId) {
      const organization =
        await this.database.client.organization.findFirst({
          where: {
            id: organizationId,
            tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

      if (!organization) {
        throw new NotFoundException(
          'Organization not found in the current tenant',
        );
      }
    }

    if (branchId) {
      const branch =
        await this.database.client.branch.findFirst({
          where: {
            id: branchId,
            tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: {
            id: true,
            organizationId: true,
          },
        });

      if (!branch) {
        throw new NotFoundException(
          'Branch not found in the current tenant',
        );
      }

      if (
        organizationId &&
        branch.organizationId &&
        branch.organizationId !== organizationId
      ) {
        throw new BadRequestException(
          'Branch does not belong to the selected organization',
        );
      }
    }

    if (parentId) {
      if (
        currentDepartmentId &&
        parentId === currentDepartmentId
      ) {
        throw new BadRequestException(
          'A department cannot be its own parent',
        );
      }

      const parent =
        await this.database.client.department.findFirst({
          where: {
            id: parentId,
            tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: {
            id: true,
            organizationId: true,
            branchId: true,
          },
        });

      if (!parent) {
        throw new NotFoundException(
          'Parent department not found in the current tenant',
        );
      }

      if (
        organizationId &&
        parent.organizationId &&
        parent.organizationId !== organizationId
      ) {
        throw new BadRequestException(
          'Parent department does not belong to the selected organization',
        );
      }

      if (
        branchId &&
        parent.branchId &&
        parent.branchId !== branchId
      ) {
        throw new BadRequestException(
          'Parent department does not belong to the selected branch',
        );
      }
    }
  }
}
