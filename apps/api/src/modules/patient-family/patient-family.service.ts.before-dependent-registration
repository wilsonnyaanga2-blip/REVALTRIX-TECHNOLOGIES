import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { CreateFamilyRelationshipRequestDto } from './dto/create-family-relationship-request.dto.js';
import type { RespondFamilyRelationshipRequestDto } from './dto/respond-family-relationship-request.dto.js';
import type { RevokeFamilyRelationshipDto } from './dto/revoke-family-relationship.dto.js';

@Injectable()
export class PatientFamilyService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  private async getPatientProfile(
    userId: string,
  ) {
    const patient =
      await this.database.client.patientProfile.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
          platformPatientId: true,
          firstName: true,
          secondName: true,
        },
      });

    if (!patient) {
      throw new NotFoundException(
        'Authenticated user is not a Revaltrix patient',
      );
    }

    return patient;
  }

  private async getPatientProfileId(
    userId: string,
  ): Promise<string> {
    const patient = await this.getPatientProfile(userId);
    return patient.id;
  }

  async listRelationships(userId: string) {
    const patientProfileId =
      await this.getPatientProfileId(userId);

    const relationships =
      await this.database.client.patientFamilyRelationship.findMany({
        where: {
          OR: [
            {
              patientProfileId,
            },
            {
              relatedPatientProfileId: patientProfileId,
            },
          ],
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          relationshipType: true,
          status: true,
          createdAt: true,
          revokedAt: true,
          patientProfile: {
            select: {
              id: true,
              platformPatientId: true,
              firstName: true,
              secondName: true,
            },
          },
          relatedPatientProfile: {
            select: {
              id: true,
              platformPatientId: true,
              firstName: true,
              secondName: true,
            },
          },
        },
      });

    return {
      data: relationships.map((relationship) => {
        const outgoing =
          relationship.patientProfile.id === patientProfileId;

        return {
          id: relationship.id,
          relationshipType: relationship.relationshipType,
          status: relationship.status,
          createdAt: relationship.createdAt,
          revokedAt: relationship.revokedAt,
          patient: outgoing
            ? relationship.patientProfile
            : relationship.relatedPatientProfile,
          relatedPatient: outgoing
            ? relationship.relatedPatientProfile
            : relationship.patientProfile,
          direction: outgoing ? 'OUTGOING' : 'INCOMING',
        };
      }),
    };
  }

  async listPendingRequests(userId: string) {
    const patientProfileId =
      await this.getPatientProfileId(userId);

    const now = new Date();

    const requests =
      await this.database.client.patientFamilyRelationshipRequest.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  requesterPatientProfileId: patientProfileId,
                },
                {
                  targetPatientProfileId: patientProfileId,
                },
              ],
            },
            {
              status: 'PENDING',
            },
            {
              OR: [
                {
                  expiresAt: null,
                },
                {
                  expiresAt: {
                    gt: now,
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          requestedAt: 'desc',
        },
        select: {
          id: true,
          relationshipType: true,
          status: true,
          reason: true,
          requestedAt: true,
          respondedAt: true,
          expiresAt: true,
          requesterPatientProfile: {
            select: {
              id: true,
              platformPatientId: true,
              firstName: true,
              secondName: true,
            },
          },
          targetPatientProfile: {
            select: {
              id: true,
              platformPatientId: true,
              firstName: true,
              secondName: true,
            },
          },
        },
      });

    return {
      data: requests.map((request) => {
        const outgoing =
          request.requesterPatientProfile.id === patientProfileId;

        return {
          id: request.id,
          relationshipType: request.relationshipType,
          status: request.status,
          reason: request.reason,
          requestedAt: request.requestedAt,
          respondedAt: request.respondedAt,
          expiresAt: request.expiresAt,
          requesterPatientProfile:
            request.requesterPatientProfile,
          targetPatientProfile:
            request.targetPatientProfile,
          direction: outgoing ? 'OUTGOING' : 'INCOMING',
        };
      }),
    };
  }

  async createRequest(
    userId: string,
    dto: CreateFamilyRelationshipRequestDto,
  ) {
    const requester = await this.getPatientProfile(userId);

    const target =
      await this.database.client.patientProfile.findUnique({
        where: {
          platformPatientId:
            dto.targetPlatformPatientId.trim(),
        },
        select: {
          id: true,
          platformPatientId: true,
          firstName: true,
          secondName: true,
        },
      });

    if (!target) {
      throw new NotFoundException(
        'Target Revaltrix patient was not found',
      );
    }

    if (target.id === requester.id) {
      throw new BadRequestException(
        'A patient cannot create a family relationship with themselves',
      );
    }

    const existingActive =
      await this.database.client.patientFamilyRelationship.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              patientProfileId: requester.id,
              relatedPatientProfileId: target.id,
            },
            {
              patientProfileId: target.id,
              relatedPatientProfileId: requester.id,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    if (existingActive) {
      throw new ConflictException(
        'An active family relationship already exists between these patients',
      );
    }

    const existingPending =
      await this.database.client.patientFamilyRelationshipRequest.findFirst({
        where: {
          status: 'PENDING',
          OR: [
            {
              requesterPatientProfileId: requester.id,
              targetPatientProfileId: target.id,
            },
            {
              requesterPatientProfileId: target.id,
              targetPatientProfileId: requester.id,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    if (existingPending) {
      throw new ConflictException(
        'A pending family relationship request already exists between these patients',
      );
    }

    let request;

    try {
      request = await this.database.client.$transaction(
        async (tx) => {
          const activeRelationship =
            await tx.patientFamilyRelationship.findFirst({
              where: {
                status: 'ACTIVE',
                OR: [
                  {
                    patientProfileId: requester.id,
                    relatedPatientProfileId: target.id,
                  },
                  {
                    patientProfileId: target.id,
                    relatedPatientProfileId: requester.id,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

          if (activeRelationship) {
            throw new ConflictException(
              'An active family relationship already exists between these patients',
            );
          }

          const pendingRequest =
            await tx.patientFamilyRelationshipRequest.findFirst({
              where: {
                status: 'PENDING',
                OR: [
                  {
                    requesterPatientProfileId: requester.id,
                    targetPatientProfileId: target.id,
                  },
                  {
                    requesterPatientProfileId: target.id,
                    targetPatientProfileId: requester.id,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

          if (pendingRequest) {
            throw new ConflictException(
              'A pending family relationship request already exists between these patients',
            );
          }

          const created =
            await tx.patientFamilyRelationshipRequest.create({
              data: {
                requesterPatientProfileId: requester.id,
                targetPatientProfileId: target.id,
                relationshipType: dto.relationshipType,
                status: 'PENDING',
                requestedByUserId: userId,
                reason: dto.reason?.trim() || null,
              },
              select: {
                id: true,
                relationshipType: true,
                status: true,
                reason: true,
                requestedAt: true,
                expiresAt: true,
                requesterPatientProfile: {
                  select: {
                    platformPatientId: true,
                    firstName: true,
                    secondName: true,
                  },
                },
                targetPatientProfile: {
                  select: {
                    platformPatientId: true,
                    firstName: true,
                    secondName: true,
                  },
                },
              },
            });

          await tx.auditEvent.create({
            data: {
              tenantId: null,
              actorUserId: userId,
              action: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST_CREATED',
              resourceType: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST',
              resourceId: created.id,
              outcome: 'SUCCESS',
              reason:
                dto.reason?.trim() ||
                'Patient initiated a family relationship request',
              metadata: {
                requesterPatientProfileId: requester.id,
                targetPatientProfileId: target.id,
                relationshipType: dto.relationshipType,
              },
            },
          });

          return created;
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'A concurrent family relationship request changed this relationship. Please retry.',
        );
      }

      throw error;
    }

    return {
      data: request,
    };
  }

  async respondToRequest(
    userId: string,
    requestId: string,
    dto: RespondFamilyRelationshipRequestDto,
  ) {
    const patientProfileId =
      await this.getPatientProfileId(userId);

    const request =
      await this.database.client.patientFamilyRelationshipRequest.findUnique({
        where: {
          id: requestId,
        },
        select: {
          id: true,
          requesterPatientProfileId: true,
          targetPatientProfileId: true,
          relationshipType: true,
          status: true,
          expiresAt: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Family relationship request was not found',
      );
    }

    if (request.targetPatientProfileId !== patientProfileId) {
      throw new NotFoundException(
        'Family relationship request was not found',
      );
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException(
        'This family relationship request is no longer pending',
      );
    }

    const now = new Date();

    if (request.expiresAt && request.expiresAt <= now) {
      await this.database.client.$transaction(async (tx) => {
        await tx.patientFamilyRelationshipRequest.update({
          where: {
            id: request.id,
          },
          data: {
            status: 'EXPIRED',
          },
        });

        await tx.auditEvent.create({
          data: {
            tenantId: null,
            actorUserId: userId,
            action: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST_EXPIRED',
            resourceType: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST',
            resourceId: request.id,
            outcome: 'SUCCESS',
            reason: 'Family relationship request expired',
            metadata: {
              requesterPatientProfileId:
                request.requesterPatientProfileId,
              targetPatientProfileId:
                request.targetPatientProfileId,
            },
          },
        });
      });

      throw new ConflictException(
        'This family relationship request has expired',
      );
    }

    if (dto.response === 'DECLINE') {
      const declined =
        await this.database.client.$transaction(async (tx) => {
          const result =
            await tx.patientFamilyRelationshipRequest.update({
              where: {
                id: request.id,
              },
              data: {
                status: 'DECLINED',
                respondedByUserId: userId,
                respondedAt: now,
                responseReason:
                  dto.responseReason?.trim() || null,
              },
            });

          await tx.auditEvent.create({
            data: {
              tenantId: null,
              actorUserId: userId,
              action: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST_DECLINED',
              resourceType: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST',
              resourceId: request.id,
              outcome: 'SUCCESS',
              reason:
                dto.responseReason?.trim() ||
                'Patient declined a family relationship request',
              metadata: {
                requesterPatientProfileId:
                  request.requesterPatientProfileId,
                targetPatientProfileId:
                  request.targetPatientProfileId,
                relationshipType: request.relationshipType,
              },
            },
          });

          return result;
        });

      return {
        data: declined,
      };
    }

    let result;

    try {
      result = await this.database.client.$transaction(
        async (tx) => {
          const currentRequest =
            await tx.patientFamilyRelationshipRequest.findUnique({
              where: {
                id: request.id,
              },
              select: {
                id: true,
                requesterPatientProfileId: true,
                targetPatientProfileId: true,
                relationshipType: true,
                status: true,
                expiresAt: true,
              },
            });

          if (
            !currentRequest ||
            currentRequest.targetPatientProfileId !== patientProfileId
          ) {
            throw new NotFoundException(
              'Family relationship request was not found',
            );
          }

          if (currentRequest.status !== 'PENDING') {
            throw new ConflictException(
              'This family relationship request is no longer pending',
            );
          }

          const transactionNow = new Date();

          if (
            currentRequest.expiresAt &&
            currentRequest.expiresAt <= transactionNow
          ) {
            await tx.patientFamilyRelationshipRequest.update({
              where: {
                id: currentRequest.id,
              },
              data: {
                status: 'EXPIRED',
              },
            });

            await tx.auditEvent.create({
              data: {
                tenantId: null,
                actorUserId: userId,
                action: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST_EXPIRED',
                resourceType: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST',
                resourceId: currentRequest.id,
                outcome: 'SUCCESS',
                reason: 'Family relationship request expired',
                metadata: {
                  requesterPatientProfileId:
                    currentRequest.requesterPatientProfileId,
                  targetPatientProfileId:
                    currentRequest.targetPatientProfileId,
                },
              },
            });

            throw new ConflictException(
              'This family relationship request has expired',
            );
          }

          const existingRelationship =
            await tx.patientFamilyRelationship.findFirst({
              where: {
                status: 'ACTIVE',
                OR: [
                  {
                    patientProfileId:
                      currentRequest.requesterPatientProfileId,
                    relatedPatientProfileId:
                      currentRequest.targetPatientProfileId,
                  },
                  {
                    patientProfileId:
                      currentRequest.targetPatientProfileId,
                    relatedPatientProfileId:
                      currentRequest.requesterPatientProfileId,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

          if (existingRelationship) {
            throw new ConflictException(
              'An active family relationship already exists between these patients',
            );
          }

          const accepted =
            await tx.patientFamilyRelationshipRequest.update({
              where: {
                id: currentRequest.id,
              },
              data: {
                status: 'ACCEPTED',
                respondedByUserId: userId,
                respondedAt: transactionNow,
                responseReason:
                  dto.responseReason?.trim() || null,
              },
            });

          const relationship =
            await tx.patientFamilyRelationship.create({
              data: {
                patientProfileId:
                  currentRequest.requesterPatientProfileId,
                relatedPatientProfileId:
                  currentRequest.targetPatientProfileId,
                relationshipType:
                  currentRequest.relationshipType,
                status: 'ACTIVE',
                createdByUserId: userId,
              },
              select: {
                id: true,
                relationshipType: true,
                status: true,
                createdAt: true,
                patientProfile: {
                  select: {
                    platformPatientId: true,
                    firstName: true,
                    secondName: true,
                  },
                },
                relatedPatientProfile: {
                  select: {
                    platformPatientId: true,
                    firstName: true,
                    secondName: true,
                  },
                },
              },
            });

          await tx.auditEvent.create({
            data: {
              tenantId: null,
              actorUserId: userId,
              action: 'PATIENT_FAMILY_RELATIONSHIP_ACCEPTED',
              resourceType: 'PATIENT_FAMILY_RELATIONSHIP',
              resourceId: relationship.id,
              outcome: 'SUCCESS',
              reason:
                dto.responseReason?.trim() ||
                'Patient accepted a family relationship request',
              metadata: {
                requestId: accepted.id,
                requesterPatientProfileId:
                  currentRequest.requesterPatientProfileId,
                targetPatientProfileId:
                  currentRequest.targetPatientProfileId,
                relationshipType:
                  currentRequest.relationshipType,
              },
            },
          });

          return relationship;
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'A concurrent family relationship change occurred. Please retry.',
        );
      }

      throw error;
    }

    return {
      data: result,
    };
  }

  async cancelRequest(
    userId: string,
    requestId: string,
  ) {
    const patientProfileId =
      await this.getPatientProfileId(userId);

    const request =
      await this.database.client.patientFamilyRelationshipRequest.findUnique({
        where: {
          id: requestId,
        },
        select: {
          id: true,
          requesterPatientProfileId: true,
          targetPatientProfileId: true,
          status: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Family relationship request was not found',
      );
    }

    if (request.requesterPatientProfileId !== patientProfileId) {
      throw new NotFoundException(
        'Family relationship request was not found',
      );
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException(
        'Only a pending family relationship request can be cancelled',
      );
    }

    const cancelled =
      await this.database.client.$transaction(async (tx) => {
        const result =
          await tx.patientFamilyRelationshipRequest.update({
            where: {
              id: request.id,
            },
            data: {
              status: 'CANCELLED',
              respondedAt: new Date(),
              responseReason: 'Cancelled by requesting patient',
            },
          });

        await tx.auditEvent.create({
          data: {
            tenantId: null,
            actorUserId: userId,
            action: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST_CANCELLED',
            resourceType: 'PATIENT_FAMILY_RELATIONSHIP_REQUEST',
            resourceId: request.id,
            outcome: 'SUCCESS',
            reason: 'Patient cancelled their family relationship request',
            metadata: {
              requesterPatientProfileId:
                request.requesterPatientProfileId,
              targetPatientProfileId:
                request.targetPatientProfileId,
            },
          },
        });

        return result;
      });

    return {
      data: cancelled,
    };
  }

  async revokeRelationship(
    userId: string,
    relationshipId: string,
    dto: RevokeFamilyRelationshipDto,
  ) {
    const patientProfileId =
      await this.getPatientProfileId(userId);

    const relationship =
      await this.database.client.patientFamilyRelationship.findUnique({
        where: {
          id: relationshipId,
        },
        select: {
          id: true,
          patientProfileId: true,
          relatedPatientProfileId: true,
          status: true,
          relationshipType: true,
        },
      });

    if (!relationship) {
      throw new NotFoundException(
        'Family relationship was not found',
      );
    }

    if (
      relationship.patientProfileId !== patientProfileId &&
      relationship.relatedPatientProfileId !== patientProfileId
    ) {
      throw new NotFoundException(
        'Family relationship was not found',
      );
    }

    if (relationship.status !== 'ACTIVE') {
      throw new ConflictException(
        'Only an active family relationship can be revoked',
      );
    }

    const revoked =
      await this.database.client.$transaction(async (tx) => {
        const result =
          await tx.patientFamilyRelationship.update({
            where: {
              id: relationship.id,
            },
            data: {
              status: 'REVOKED',
              revokedByUserId: userId,
              revokedAt: new Date(),
            },
          });

        await tx.auditEvent.create({
          data: {
            tenantId: null,
            actorUserId: userId,
            action: 'PATIENT_FAMILY_RELATIONSHIP_REVOKED',
            resourceType: 'PATIENT_FAMILY_RELATIONSHIP',
            resourceId: relationship.id,
            outcome: 'SUCCESS',
            reason:
              dto.reason?.trim() ||
              'Patient revoked a family relationship',
            metadata: {
              patientProfileId,
              relationshipPatientProfileId:
                relationship.patientProfileId,
              relatedPatientProfileId:
                relationship.relatedPatientProfileId,
              relationshipType:
                relationship.relationshipType,
            },
          },
        });

        return result;
      });

    return {
      data: revoked,
    };
  }
}
