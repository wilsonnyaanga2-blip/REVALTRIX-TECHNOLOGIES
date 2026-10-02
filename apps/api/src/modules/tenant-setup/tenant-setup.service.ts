import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { TenantSetupStatus, TenantType } from '@prisma/client';

export interface ReadinessRequirement {
  key: string;
  label: string;
  weight: number;
  required: boolean;
  available: boolean;
  complete: boolean;
}

@Injectable()
export class TenantSetupService {
  constructor(private readonly database: DatabaseService) {}

  async getSetup(userId: string) {
    const membership = await this.database.client.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        tenant: {
          status: 'ACTIVE',
        },
      },
      select: {
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            legalName: true,
            type: true,
            status: true,
            profile: true,
            setup: true,
            _count: {
              select: {
                branches: true,
                departments: true,
                memberships: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!membership) {
      throw new NotFoundException('Active tenant membership not found');
    }

    const [serviceCount, administratorCount] = await Promise.all([
      this.database.client.service.count({
        where: {
          tenantId: membership.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.database.client.membership.count({
        where: {
          tenantId: membership.tenantId,
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
          roles: {
            some: {
              role: {
                code: 'TENANT_ADMIN',
                status: 'ACTIVE',
              },
            },
          },
        },
      }),
    ]);

    return this.calculateAndPersist(
      membership.tenant,
      serviceCount,
      administratorCount,
    );
  }

  private async calculateAndPersist(
    tenant: {
    id: string;
    name: string;
    legalName: string | null;
    type: TenantType;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    profile: {
      businessName: string | null;
      legalName: string | null;
      registrationNumber: string | null;
      taxIdentificationNumber: string | null;
      country: string;
      address: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      website: string | null;
    } | null;
    setup: {
      status: TenantSetupStatus;
      readinessPercent: number;
      readyAt: Date | null;
      liveAt: Date | null;
      suspendedAt: Date | null;
    } | null;
    _count: {
      branches: number;
      departments: number;
      memberships: number;
    };
  },
  serviceCount: number,
  administratorCount: number,
  ) {
    const requirements = this.buildRequirements(
      tenant,
      serviceCount,
      administratorCount,
    );

    const availableRequirements = requirements.filter(
      (requirement) => requirement.available,
    );

    const totalWeight = availableRequirements.reduce(
      (sum, requirement) => sum + requirement.weight,
      0,
    );

    const completedWeight = availableRequirements
      .filter((requirement) => requirement.complete)
      .reduce((sum, requirement) => sum + requirement.weight, 0);

    const readinessPercent =
      totalWeight === 0
        ? 0
        : Math.round((completedWeight / totalWeight) * 100);

    const allRequiredComplete = availableRequirements
      .filter((requirement) => requirement.required)
      .every((requirement) => requirement.complete);

    let status = tenant.setup?.status ?? TenantSetupStatus.NOT_STARTED;

    if (tenant.setup?.status !== TenantSetupStatus.LIVE &&
        tenant.setup?.status !== TenantSetupStatus.SUSPENDED) {
      if (allRequiredComplete) {
        status = TenantSetupStatus.READY;
      } else if (readinessPercent > 0) {
        status = TenantSetupStatus.IN_PROGRESS;
      } else {
        status = TenantSetupStatus.NOT_STARTED;
      }
    }

    const setup = await this.database.client.tenantSetup.upsert({
      where: {
        tenantId: tenant.id,
      },
      create: {
        tenantId: tenant.id,
        status,
        readinessPercent,
        readyAt: allRequiredComplete ? new Date() : null,
        lastCalculatedAt: new Date(),
      },
      update: {
        status,
        readinessPercent,
        readyAt: allRequiredComplete
          ? tenant.setup?.readyAt ?? new Date()
          : null,
        lastCalculatedAt: new Date(),
      },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        legalName: tenant.legalName,
        type: tenant.type,
        status: tenant.status,
      },
      setup: {
        status: setup.status,
        readinessPercent: setup.readinessPercent,
        readyAt: setup.readyAt,
        liveAt: setup.liveAt,
      },
      requirements,
      summary: {
        total: requirements.length,
        completed: requirements.filter((item) => item.complete).length,
        required: requirements.filter((item) => item.required).length,
        requiredCompleted: requirements.filter(
          (item) => item.required && item.complete,
        ).length,
        ready: allRequiredComplete,
      },
    };
  }

  private buildRequirements(tenant: {
    type: TenantType;
    name: string;
    legalName: string | null;
    profile: {
      businessName: string | null;
      legalName: string | null;
      registrationNumber: string | null;
      taxIdentificationNumber: string | null;
      country: string;
      address: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      website: string | null;
    } | null;
    _count: {
      branches: number;
      departments: number;
      memberships: number;
    };
  },
  serviceCount: number,
  administratorCount: number,
  ): ReadinessRequirement[] {
    const profile = tenant.profile;

    const requirements: ReadinessRequirement[] = [
      {
        key: 'organization_identity',
        label: 'Organization identity',
        weight: 15,
        required: true,
        available: true,
        complete: Boolean(
          tenant.name.trim() &&
          (profile?.businessName?.trim() || tenant.name.trim()) &&
          (profile?.legalName?.trim() || tenant.legalName?.trim()),
        ),
      },
      {
        key: 'legal_information',
        label: 'Legal and registration information',
        weight: 10,
        required: true,
        available: true,
        complete: Boolean(
          profile?.registrationNumber?.trim() &&
          profile?.taxIdentificationNumber?.trim(),
        ),
      },
      {
        key: 'location',
        label: 'Organization location',
        weight: 10,
        required: true,
        available: true,
        complete: Boolean(
          profile?.country?.trim() &&
          profile?.address?.trim(),
        ),
      },
      {
        key: 'official_contacts',
        label: 'Official contact details',
        weight: 10,
        required: true,
        available: true,
        complete: Boolean(
          profile?.contactEmail?.trim() &&
          profile?.contactPhone?.trim(),
        ),
      },
      {
        key: 'administrator',
        label: 'Administrator access',
        weight: 10,
        required: true,
        available: true,
        complete: administratorCount > 0,
      },
      {
        key: 'branches',
        label: 'Branches',
        weight: 10,
        required: true,
        available: true,
        complete: tenant._count.branches > 0,
      },
      {
        key: 'departments',
        label: 'Departments',
        weight: 10,
        required: this.requiresDepartments(tenant.type),
        available: true,
        complete: tenant._count.departments > 0,
      },
      {
        key: 'services',
        label: 'Services',
        weight: 10,
        required: true,
        available: true,
        complete: serviceCount > 0,
      },
      {
        key: 'providers',
        label: 'Providers',
        weight: 5,
        required: this.requiresProviders(tenant.type),
        available: false,
        complete: false,
      },
      {
        key: 'resources',
        label: 'Operational resources',
        weight: 5,
        required: this.requiresResources(tenant.type),
        available: false,
        complete: false,
      },
      {
        key: 'payments',
        label: 'Payment configuration',
        weight: 5,
        required: true,
        available: false,
        complete: false,
      },
    ];

    return requirements;
  }

  private requiresDepartments(type: TenantType): boolean {
    return (
      type !== TenantType.OPTICAL_CENTER &&
      type !== TenantType.PHARMACY &&
      type !== TenantType.AMBULANCE_PROVIDER
    );
  }

  private requiresProviders(type: TenantType): boolean {
    return (
      type !== TenantType.PHARMACY &&
      type !== TenantType.AMBULANCE_PROVIDER
    );
  }

  private requiresResources(type: TenantType): boolean {
    return type !== TenantType.OTHER_HEALTHCARE_PROVIDER;
  }
}
