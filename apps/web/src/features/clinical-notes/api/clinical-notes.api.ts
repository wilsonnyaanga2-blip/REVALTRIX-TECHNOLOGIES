import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  AmendClinicalNoteInput,
  ClinicalNote,
  ClinicalNoteListResponse,
  ClinicalNoteVersionsResponse,
  CreateClinicalNoteInput,
  UpdateClinicalNoteInput,
  VoidClinicalNoteInput,
} from '../types/clinical-note.types.js';

export function getClinicalNotes(
  encounterId: string,
): Promise<ClinicalNoteListResponse> {
  return authenticatedApiRequest<ClinicalNoteListResponse>(
    `/v1/clinical-notes/encounter/${encodeURIComponent(encounterId)}`,
  );
}

export function getClinicalNote(
  clinicalNoteId: string,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}`,
  );
}

export function getClinicalNoteVersions(
  clinicalNoteId: string,
): Promise<ClinicalNoteVersionsResponse> {
  return authenticatedApiRequest<ClinicalNoteVersionsResponse>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}/versions`,
  );
}

export function createClinicalNote(
  input: CreateClinicalNoteInput,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    '/v1/clinical-notes',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function updateClinicalNote(
  clinicalNoteId: string,
  input: UpdateClinicalNoteInput,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export function signClinicalNote(
  clinicalNoteId: string,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}/sign`,
    {
      method: 'POST',
    },
  );
}

export function finalizeClinicalNote(
  clinicalNoteId: string,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}/finalize`,
    {
      method: 'POST',
    },
  );
}

export function amendClinicalNote(
  clinicalNoteId: string,
  input: AmendClinicalNoteInput,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}/amend`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function voidClinicalNote(
  clinicalNoteId: string,
  input: VoidClinicalNoteInput,
): Promise<ClinicalNote> {
  return authenticatedApiRequest<ClinicalNote>(
    `/v1/clinical-notes/${encodeURIComponent(clinicalNoteId)}/void`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}
