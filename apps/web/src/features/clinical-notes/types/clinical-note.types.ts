export type ClinicalNoteType =
  | 'CONSULTATION'
  | 'PROGRESS'
  | 'EMERGENCY'
  | 'ADMISSION'
  | 'DISCHARGE'
  | 'PROCEDURE'
  | 'FOLLOW_UP'
  | 'TELEMEDICINE';

export type ClinicalNoteStatus =
  | 'DRAFT'
  | 'SIGNED'
  | 'FINAL'
  | 'AMENDED'
  | 'VOID';

export interface ClinicalNote {
  id: string;
  tenantId: string;
  patientTenantRecordId: string;
  encounterId: string;
  authorUserId: string;
  authorProviderId: string | null;
  noteNumber: string;
  type: ClinicalNoteType;
  status: ClinicalNoteStatus;
  chiefComplaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  signedAt: string | null;
  finalizedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNoteListResponse {
  encounter: {
    id: string;
    encounterNumber: string;
  };
  data: ClinicalNote[];
}

export interface ClinicalNoteVersion {
  id: string;
  versionNumber: number;
  chiefComplaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  createdByUserId: string;
  amendmentReason: string | null;
  signedAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    displayName: string;
  };
}

export interface ClinicalNoteVersionsResponse {
  note: {
    id: string;
    noteNumber: string;
    encounterId: string;
    status: ClinicalNoteStatus;
  };
  data: ClinicalNoteVersion[];
}

export interface CreateClinicalNoteInput {
  patientTenantRecordId: string;
  encounterId: string;
  type: ClinicalNoteType;
  authorProviderId?: string;
  chiefComplaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface UpdateClinicalNoteInput {
  chiefComplaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface AmendClinicalNoteInput {
  chiefComplaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  amendmentReason?: string;
}

export interface VoidClinicalNoteInput {
  reason: string;
}
