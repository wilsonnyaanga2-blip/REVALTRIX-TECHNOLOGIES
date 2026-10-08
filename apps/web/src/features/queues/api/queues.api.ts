import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import { getAuthSession } from '../../auth/api/auth-session.js';
import type {
  CreateQueueInput,
  Queue,
  QueueEntry,
  QueueEntryStatus,
} from '../types/queue.types.js';

interface QueueListResponse {
  data: Queue[];
}

interface QueueEntryListResponse {
  data: QueueEntry[];
}

export interface QueueCareAttachment {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
}

export interface QueueCareRecord {
  id: string;
  note: string | null;
  procedures: string | null;
  documentUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  attachments: QueueCareAttachment[];
}

interface CreatedQueueCareRecord {
  id: string;
}

interface QueueCareRecordListResponse {
  data: QueueCareRecord[];
}

export interface QueueReconciliationResult {
  checkedInToday: number;
  queued: number;
  alreadyQueued: number;
}

interface QueueReconciliationResponse {
  data: QueueReconciliationResult;
}

export async function getQueues(): Promise<Queue[]> {
  const response = await authenticatedApiRequest<QueueListResponse>('/v1/queues?status=ACTIVE');

  return response.data;
}

export async function reconcileTodayQueues(): Promise<QueueReconciliationResult> {
  const response = await authenticatedApiRequest<QueueReconciliationResponse>(
    '/v1/queues/reconcile/today',
    {
      method: 'POST',
    },
  );

  return response.data;
}

export async function createQueue(input: CreateQueueInput): Promise<Queue> {
  return authenticatedApiRequest<Queue>('/v1/queues', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getQueueEntries(
  queueId: string,
  status?: QueueEntryStatus,
): Promise<QueueEntry[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  const response = await authenticatedApiRequest<QueueEntryListResponse>(
    `/v1/queues/${encodeURIComponent(queueId)}/entries${query}`,
  );

  return response.data;
}

async function transitionQueueEntry(
  entryId: string,
  action: 'call' | 'start' | 'complete' | 'skip' | 'no-show' | 'cancel',
): Promise<unknown> {
  return authenticatedApiRequest(`/v1/queues/entries/${encodeURIComponent(entryId)}/${action}`, {
    method: 'POST',
  });
}

export function callQueueEntry(entryId: string): Promise<unknown> {
  return transitionQueueEntry(entryId, 'call');
}

export function startQueueEntry(entryId: string): Promise<unknown> {
  return transitionQueueEntry(entryId, 'start');
}

export function completeQueueEntry(entryId: string): Promise<unknown> {
  return transitionQueueEntry(entryId, 'complete');
}

export function skipQueueEntry(entryId: string): Promise<unknown> {
  return transitionQueueEntry(entryId, 'skip');
}

export function noShowQueueEntry(entryId: string): Promise<unknown> {
  return transitionQueueEntry(entryId, 'no-show');
}

export function cancelQueueEntry(entryId: string): Promise<unknown> {
  return transitionQueueEntry(entryId, 'cancel');
}

export async function getQueueCareRecords(entryId: string): Promise<QueueCareRecord[]> {
  const response = await authenticatedApiRequest<QueueCareRecordListResponse>(
    `/v1/queues/entries/${encodeURIComponent(entryId)}/care-records`,
  );

  return response.data;
}

export function createQueueCareRecord(
  entryId: string,
  input: { note?: string; procedures?: string; documentUrl?: string },
): Promise<CreatedQueueCareRecord> {
  return authenticatedApiRequest<CreatedQueueCareRecord>(
    `/v1/queues/entries/${encodeURIComponent(entryId)}/care-records`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function uploadQueueCareAttachment(
  careRecordId: string,
  file: File,
): Promise<QueueCareAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  return authenticatedApiRequest<QueueCareAttachment>(
    `/v1/queues/care-records/${encodeURIComponent(careRecordId)}/attachments`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function downloadQueueCareAttachment(attachmentId: string): Promise<Blob> {
  const session = getAuthSession();

  if (!session) {
    throw new Error('Authentication required.');
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '/api';
  const response = await fetch(
    `${apiBaseUrl}/v1/queues/care-attachments/${encodeURIComponent(attachmentId)}/download`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to download clinical attachment (status ${response.status})`);
  }

  return response.blob();
}

export async function createPatientJourneyHandoff(
  journeyId: string,
  input: {
    fromStepId: string;
    toDepartmentId: string;
    reason: string;
    instruction?: string;
  },
): Promise<unknown> {
  return authenticatedApiRequest(`/v1/patient-journeys/${encodeURIComponent(journeyId)}/handoffs`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
