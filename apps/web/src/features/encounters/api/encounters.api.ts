import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  CreateEncounterInput,
  Encounter,
  EncounterListResponse,
  EncounterStatusHistory,
} from '../types/encounter.types.js';

export async function getEncounters(): Promise<EncounterListResponse> {
  return authenticatedApiRequest<EncounterListResponse>(
    '/v1/encounters',
  );
}

export async function createEncounter(
  input: CreateEncounterInput,
): Promise<Encounter> {
  return authenticatedApiRequest<Encounter>(
    '/v1/encounters',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function getEncounter(
  encounterId: string,
): Promise<Encounter> {
  return authenticatedApiRequest<Encounter>(
    `/v1/encounters/${encodeURIComponent(encounterId)}`,
  );
}

export async function getEncounterHistory(
  encounterId: string,
): Promise<EncounterStatusHistory[]> {
  return authenticatedApiRequest<EncounterStatusHistory[]>(
    `/v1/encounters/${encodeURIComponent(encounterId)}/history`,
  );
}

async function transitionEncounter(
  encounterId: string,
  action:
    | 'check-in'
    | 'triage'
    | 'start'
    | 'complete'
    | 'cancel'
    | 'no-show'
    | 'refer',
  input?: { reason?: string; departmentId?: string },
): Promise<Encounter> {
  return authenticatedApiRequest<Encounter>(
    `/v1/encounters/${encodeURIComponent(encounterId)}/${action}`,
    {
      method: 'POST',
      body: input
        ? JSON.stringify(input)
        : undefined,
    },
  );
}

export function checkInEncounter(
  encounterId: string,
  input: { reason: string; departmentId: string },
): Promise<Encounter> {
  return transitionEncounter(encounterId, 'check-in', input);
}

export function triageEncounter(
  encounterId: string,
): Promise<Encounter> {
  return transitionEncounter(encounterId, 'triage');
}

export function startEncounter(
  encounterId: string,
): Promise<Encounter> {
  return transitionEncounter(encounterId, 'start');
}

export function completeEncounter(
  encounterId: string,
): Promise<Encounter> {
  return transitionEncounter(encounterId, 'complete');
}

export function cancelEncounter(
  encounterId: string,
  reason: string,
): Promise<Encounter> {
  return transitionEncounter(
    encounterId,
    'cancel',
    { reason },
  );
}

export function noShowEncounter(
  encounterId: string,
): Promise<Encounter> {
  return transitionEncounter(encounterId, 'no-show');
}

export function referEncounter(
  encounterId: string,
  reason?: string,
): Promise<Encounter> {
  return transitionEncounter(
    encounterId,
    'refer',
    { reason },
  );
}
