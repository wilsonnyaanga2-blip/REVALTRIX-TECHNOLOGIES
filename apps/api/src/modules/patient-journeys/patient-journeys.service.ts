import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationChannel,
  PatientJourneyHandoffStatus,
  PatientJourneyStepStatus,
  PatientJourneyStepType,
  Prisma,
  RecordStatus,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { DatabaseService } from '../../database/database.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { QueuesService } from '../queues/queues.service.js';
import { CreateHandoffDto } from './dto/create-handoff.dto.js';

@Injectable()
export class PatientJourneysService {
  constructor(
    private readonly database: DatabaseService,
    private readonly authorization: AuthorizationService,
    private readonly queues: QueuesService,
    private readonly config: ConfigService,
  ) {}

  async createHandoff(userId: string, journeyId: string, dto: CreateHandoffDto) {
    const context = await this.authorization.getContext(userId);
    const reason = dto.reason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'A clinical reason is required for a department referral',
      );
    }

    return this.database.client.$transaction(
      async (tx) => {
      const journey = await tx.patientJourney.findFirst({
        where: {
          id: journeyId,
          tenantId: context.tenantId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          tenantId: true,
          encounterId: true,
          patientTenantRecordId: true,
          status: true,
          patientTenantRecord: {
            select: {
              patientProfile: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!journey) {
        throw new NotFoundException('Active patient journey not found');
      }

      const fromStep = await tx.patientJourneyStep.findFirst({
        where: {
          id: dto.fromStepId,
          journeyId: journey.id,
          tenantId: context.tenantId,
        },
        select: {
          id: true,
          sequence: true,
          status: true,
          branchId: true,
          departmentId: true,
          department: {
            select: {
              name: true,
            },
          },
          queueEntryId: true,
        },
      });

      if (!fromStep) {
        throw new NotFoundException('Source journey step not found');
      }

      if (
        fromStep.status === PatientJourneyStepStatus.COMPLETED ||
        fromStep.status === PatientJourneyStepStatus.CANCELLED ||
        fromStep.status === PatientJourneyStepStatus.SKIPPED
      ) {
        throw new BadRequestException(
          'The source journey step is no longer active',
        );
      }

      if (fromStep.status !== PatientJourneyStepStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only an in-service journey step can be referred',
        );
      }

      if (!fromStep.queueEntryId) {
        throw new BadRequestException(
          'The source journey step is not linked to an active queue entry',
        );
      }

      const careRecordCount = await tx.queueCareRecord.count({
        where: {
          tenantId: context.tenantId,
          queueEntryId: fromStep.queueEntryId,
        },
      });

      if (careRecordCount === 0) {
        throw new BadRequestException(
          'Record department care before referring the patient',
        );
      }

      if (!journey.encounterId) {
        throw new BadRequestException(
          'The patient journey has no encounter and cannot be referred',
        );
      }

      const destinationDepartment = await tx.department.findFirst({
        where: {
          id: dto.toDepartmentId,
          tenantId: context.tenantId,
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          code: true,
          branchId: true,
        },
      });

      if (!destinationDepartment) {
        throw new NotFoundException(
          'Destination department not found or inactive',
        );
      }

      const destinationBranchId =
        dto.toBranchId ?? destinationDepartment.branchId ?? null;

      if (dto.toBranchId) {
        const branch = await tx.branch.findFirst({
          where: {
            id: dto.toBranchId,
            tenantId: context.tenantId,
            status: RecordStatus.ACTIVE,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

        if (!branch) {
          throw new NotFoundException(
            'Destination branch not found or inactive',
          );
        }

        if (
          destinationDepartment.branchId &&
          destinationDepartment.branchId !== dto.toBranchId
        ) {
          throw new BadRequestException(
            'Destination department does not belong to the selected branch',
          );
        }
      }

      if (fromStep.departmentId === destinationDepartment.id) {
        throw new BadRequestException(
          'Destination department must differ from the source department',
        );
      }

      const existingHandoff = await tx.patientJourneyHandoff.findFirst({
        where: {
          tenantId: context.tenantId,
          journeyId: journey.id,
          status: PatientJourneyHandoffStatus.PENDING,
        },
        select: {
          id: true,
        },
      });

      if (existingHandoff) {
        throw new ConflictException(
          'This patient journey already has a pending handoff',
        );
      }

      const nextSequence = await tx.patientJourneyStep.aggregate({
        where: {
          journeyId: journey.id,
        },
        _max: {
          sequence: true,
        },
      });

      const handoffSequence = (nextSequence._max.sequence ?? 0) + 1;
      const serviceSequence = handoffSequence + 1;
      const now = new Date();

      const handoffStep = await tx.patientJourneyStep.create({
        data: {
          tenantId: context.tenantId,
          journeyId: journey.id,
          sequence: handoffSequence,
          type: PatientJourneyStepType.HANDOFF,
          status: PatientJourneyStepStatus.COMPLETED,
          name: `Proceed to ${destinationDepartment.name}`,
          description:
            reason,
          branchId: destinationBranchId,
          departmentId: destinationDepartment.id,
          encounterId: journey.encounterId,
          location: destinationDepartment.name,
          instruction:
            dto.instruction?.trim() ||
            `Proceed to ${destinationDepartment.name} and follow the department's check-in instructions.`,
          readyAt: now,
          completedAt: now,
        },
        select: {
          id: true,
          sequence: true,
          status: true,
        },
      });

      const serviceStep = await tx.patientJourneyStep.create({
        data: {
          tenantId: context.tenantId,
          journeyId: journey.id,
          sequence: serviceSequence,
          type: PatientJourneyStepType.SERVICE,
          status: PatientJourneyStepStatus.PENDING,
          name: destinationDepartment.name,
          description: `Service at ${destinationDepartment.name}.`,
          branchId: destinationBranchId,
          departmentId: destinationDepartment.id,
          encounterId: journey.encounterId,
        },
        select: {
          id: true,
          sequence: true,
          status: true,
        },
      });

      const handoff = await tx.patientJourneyHandoff.create({
        data: {
          tenantId: context.tenantId,
          journeyId: journey.id,
          encounterId: journey.encounterId,
          fromStepId: fromStep.id,
          toStepId: serviceStep.id,
          fromBranchId: fromStep.branchId,
          fromDepartmentId: fromStep.departmentId,
          toBranchId: destinationBranchId,
          toDepartmentId: destinationDepartment.id,
          status: PatientJourneyHandoffStatus.PENDING,
          reason,
          instruction: dto.instruction?.trim() || null,
          initiatedByUserId: userId,
        },
        select: {
          id: true,
          status: true,
          journeyId: true,
          fromStepId: true,
          toStepId: true,
          fromDepartmentId: true,
          toDepartmentId: true,
          reason: true,
          instruction: true,
          createdAt: true,
        },
      });

      const sourceQueueEntry = await tx.queueEntry.findFirst({
        where: {
          id: fromStep.queueEntryId,
          tenantId: context.tenantId,
        },
        select: {
          id: true,
          queueId: true,
          status: true,
          position: true,
        },
      });

      if (!sourceQueueEntry) {
        throw new NotFoundException('Source queue entry not found');
      }

      if (sourceQueueEntry.status !== 'IN_SERVICE') {
        throw new BadRequestException(
          'The patient is no longer in service at this department',
        );
      }

      await tx.queueEntry.update({
        where: {
          id: sourceQueueEntry.id,
        },
        data: {
          status: 'COMPLETED',
          position: null,
          completedAt: now,
        },
      });

      await tx.queueEntryHistory.create({
        data: {
          tenantId: context.tenantId,
          queueEntryId: sourceQueueEntry.id,
          fromStatus: sourceQueueEntry.status,
          toStatus: 'COMPLETED',
          fromPosition: sourceQueueEntry.position,
          toPosition: null,
          changedByUserId: userId,
        },
      });

      await tx.patientJourneyStep.update({
        where: {
          id: fromStep.id,
        },
        data: {
          status: PatientJourneyStepStatus.COMPLETED,
          completedAt: now,
        },
      });

      const destinationEntry =
        await this.queues.autoQueueJourneyDestination(tx, {
          userId,
          tenantId: context.tenantId,
          encounterId: journey.encounterId,
          patientTenantRecordId: journey.patientTenantRecordId,
          branchId: destinationBranchId,
          departmentId: destinationDepartment.id,
          reason,
        });

      await tx.patientJourneyStep.update({
        where: {
          id: serviceStep.id,
        },
        data: {
          status: PatientJourneyStepStatus.WAITING,
          queueId: destinationEntry.queueId,
          queueEntryId: destinationEntry.id,
          readyAt: now,
          instruction:
            dto.instruction?.trim() ||
            `Proceed to ${destinationDepartment.name} and follow the department's check-in instructions.`,
        },
      });

      await tx.patientJourneyHandoff.update({
        where: {
          id: handoff.id,
        },
        data: {
          status: PatientJourneyHandoffStatus.ACCEPTED,
          acceptedAt: now,
        },
      });

      const notification = await tx.notification.create({
        data: {
          tenantId: context.tenantId,
          recipientUserId:
            journey.patientTenantRecord.patientProfile.userId,
          type: 'PATIENT_DEPARTMENT_REFERRED',
          title: `Referred to ${destinationDepartment.name}`,
          body: `You have been referred from ${fromStep.department?.name ?? 'your current department'} to ${destinationDepartment.name}. Open your patient dashboard for referral details.`,
          data: {
            journeyId: journey.id,
            handoffId: handoff.id,
            fromDepartmentId: fromStep.departmentId,
            fromDepartmentName: fromStep.department?.name ?? null,
            toDepartmentId: destinationDepartment.id,
            toDepartmentName: destinationDepartment.name,
            destinationQueueId: destinationEntry.queueId,
            destinationQueueEntryId: destinationEntry.id,
            destinationQueueNumber: destinationEntry.queueNumber,
          },
        },
        select: {
          id: true,
        },
      });

      const pushConfigured =
        Boolean(this.config.get<string>('notifications.webPush.publicKey')) &&
        Boolean(this.config.get<string>('notifications.webPush.privateKey'));
      const notificationChannels = [
        NotificationChannel.IN_APP,
        ...(pushConfigured ? [NotificationChannel.PUSH] : []),
      ];

      await tx.notificationDelivery.createMany({
        data: notificationChannels.map((channel) => ({
          notificationId: notification.id,
          channel,
          status: 'PENDING',
          idempotencyKey: `patient-referral:${handoff.id}:${channel}`,
        })),
      });

      const activeDestinationMemberships = await tx.membership.findMany({
        where: {
          tenantId: context.tenantId,
          departmentId: destinationDepartment.id,
          status: 'ACTIVE',
          startsAt: {
            lte: now,
          },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          user: {
            status: RecordStatus.ACTIVE,
            deletedAt: null,
          },
        },
        select: {
          userId: true,
        },
      });
      const destinationUserIds = [
        ...new Set(activeDestinationMemberships.map((membership) => membership.userId)),
      ];

      if (destinationUserIds.length > 0) {
        const staffNotifications = await tx.notification.createManyAndReturn({
          data: destinationUserIds.map((recipientUserId) => ({
            tenantId: context.tenantId,
            recipientUserId,
            type: 'PATIENT_DEPARTMENT_REFERRAL_RECEIVED',
            title: `New referral to ${destinationDepartment.name}`,
            body: `A patient was referred from ${fromStep.department?.name ?? 'another department'} and is waiting in queue ${destinationEntry.queueNumber}. Clinical reason: ${reason}`,
            data: {
              journeyId: journey.id,
              handoffId: handoff.id,
              encounterId: journey.encounterId,
              fromDepartmentId: fromStep.departmentId,
              fromDepartmentName: fromStep.department?.name ?? null,
              toDepartmentId: destinationDepartment.id,
              toDepartmentName: destinationDepartment.name,
              destinationQueueId: destinationEntry.queueId,
              destinationQueueEntryId: destinationEntry.id,
              destinationQueueNumber: destinationEntry.queueNumber,
            },
          })),
          select: {
            id: true,
            recipientUserId: true,
          },
        });

        await tx.notificationDelivery.createMany({
          data: staffNotifications.flatMap((staffNotification) =>
            notificationChannels.map((channel) => ({
              notificationId: staffNotification.id,
              channel,
              status: 'PENDING' as const,
              idempotencyKey: `patient-referral:${handoff.id}:department:${staffNotification.recipientUserId}:${channel}`,
            })),
          ),
        });
      }

      await tx.auditEvent.create({
        data: {
          tenantId: context.tenantId,
          actorUserId: userId,
          branchId: context.branchId ?? destinationBranchId,
          action: 'PATIENT_JOURNEY_HANDOFF_CREATED',
          resourceType: 'PATIENT_JOURNEY_HANDOFF',
          resourceId: handoff.id,
          outcome: 'SUCCESS',
          reason,
          metadata: {
            journeyId: journey.id,
            encounterId: journey.encounterId,
            fromStepId: fromStep.id,
            toStepId: serviceStep.id,
            fromDepartmentId: fromStep.departmentId,
            toDepartmentId: destinationDepartment.id,
            destinationStaffNotified: destinationUserIds.length,
          },
        },
      });

      return {
        data: {
          handoff,
          handoffStep,
          destinationStep: serviceStep,
          destinationStaffNotified: destinationUserIds.length,
        },
      };
    },
    {
      maxWait: 10000,
      timeout: 30000,
    },
  );
  }
}
