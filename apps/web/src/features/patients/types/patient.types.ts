export interface PatientEnrollmentResponse {
  patientRecordId: string;
  patientProfileId: string;
  platformPatientId: string;
  patientNumber: string;
  status: PatientRecordStatus;
  registeredAt: string;
  relationshipRequestId: string;
  relationshipRequestedAt: string;
  patient: {
    firstName: string;
    secondName: string;
    displayName: string;
  };
}

export type PatientRecordStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface PatientListItem {
  id: string;
  patientNumber: string;
  status: PatientRecordStatus;
  registeredAt: string;
  patient: {
    profileId: string;
    userId: string;
    firstName: string;
    secondName: string;
    location: string | null;
    displayName: string;
  };
}

export interface PatientListResponse {
  data: PatientListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientSearchResult {
  id: string;
  patientNumber: string;
  patient: {
    profileId: string;
    firstName: string;
    secondName: string;
    displayName: string;
  };
}

export interface PatientSearchResponse {
  data: PatientSearchResult[];
}

export interface PatientDetail {
  id: string;
  patientNumber: string;
  status: PatientRecordStatus;
  registrationVerificationPending: boolean;
  relationshipApprovalPending: boolean;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  patientProfile: {
    id: string;
    userId: string;
    firstName: string;
    secondName: string;
    location: string | null;
    user: {
      id: string;
      displayName: string;
      username: string | null;
      status: string;
      identities: Array<{
        type: string;
        value: string;
        verifiedAt: string | null;
      }>;
    };
  };
}
