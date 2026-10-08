export type QueueStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export type QueueEntryStatus =
  | 'CREATED'
  | 'WAITING'
  | 'CALLED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type QueueEntryPriority =
  | 'ROUTINE'
  | 'URGENT'
  | 'PRIORITY'
  | 'EMERGENCY';

export interface Queue {
  id: string;
  tenantId: string;
  branchId: string | null;
  departmentId: string | null;
  name: string;
  code: string;
  description: string | null;
  status: QueueStatus;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

export interface QueueEntry {
  id: string;
  tenantId: string;
  queueId: string;
  encounterId: string;
  patientTenantRecordId: string;
  queueNumber: string;
  priority: QueueEntryPriority;
  status: QueueEntryStatus;
  position: number | null;
  reason: string | null;
  checkedInAt: string | null;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  cancelledAt: string | null;
  noShowAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    careRecords: number;
  };
  queue: {
    id: string;
    name: string;
    code: string;
    department?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  encounter: {
    id: string;
    encounterNumber: string;
    type: string;
    status: string;
    reason?: string | null;
  };
  journeySteps?: Array<{
    id: string;
    journeyId: string;
    sequence: number;
    status: string;
    handoffsFrom?: Array<{
      id: string;
      status: string;
      reason: string | null;
      instruction: string | null;
      toDepartmentId: string | null;
      toStepId: string | null;
      toDepartment?: {
        id: string;
        name: string;
        code: string;
      } | null;
    }>;
  }>;
  patientTenantRecord: {
    id: string;
    patientNumber: string;
    status: string;
    patientProfile: {
      id: string;
      firstName: string;
      secondName: string;
    };
  };
  calls?: Array<{
    id: string;
    callNumber: number;
    status: string;
    calledAt: string;
    acknowledgedAt: string | null;
    expiresAt: string | null;
  }>;
}

export interface CreateQueueInput {
  name: string;
  code: string;
  description?: string;
}

export interface CreateQueueEntryInput {
  queueId: string;
  encounterId: string;
  priority?: QueueEntryPriority;
  reason?: string;
}
