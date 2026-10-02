import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  PatientDetail,
  PatientListResponse,
  PatientSearchResponse,
  PatientEnrollmentResponse,
  PatientRecordStatus,
} from '../types/patient.types.js';

export interface PatientListQuery {
  search?: string;
  status?: 'ALL' | PatientRecordStatus;
  page?: number;
  pageSize?: number;
}

export async function getPatients(
  query: PatientListQuery = {},
): Promise<PatientListResponse> {
  const params = new URLSearchParams();

  if (query.search?.trim()) {
    params.set('search', query.search.trim());
  }

  if (query.status) {
    params.set('status', query.status);
  }

  if (query.page) {
    params.set('page', String(query.page));
  }

  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';

  return authenticatedApiRequest<PatientListResponse>(
    `/v1/patients${suffix}`,
  );
}

export async function searchPatients(
  query: string,
): Promise<PatientSearchResponse> {
  const params = new URLSearchParams({
    query: query.trim(),
  });

  return authenticatedApiRequest<PatientSearchResponse>(
    `/v1/patients/search?${params.toString()}`,
  );
}

export async function getPatient(
  patientRecordId: string,
): Promise<PatientDetail> {
  return authenticatedApiRequest<PatientDetail>(
    `/v1/patients/${encodeURIComponent(patientRecordId)}`,
  );
}

export interface EnrollPatientRequest {
  platformPatientId: string;
  patientNumber?: string;
}

export async function enrollPatient(
  request: EnrollPatientRequest,
): Promise<PatientEnrollmentResponse> {
  return authenticatedApiRequest<PatientEnrollmentResponse>(
    '/v1/patients/enroll',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
}


export type PatientRegistrationVerificationChannel =
  | 'EMAIL'
  | 'PHONE';

export interface RegisterPatientRequest {
  firstName: string;
  secondName: string;
  email?: string;
  phone?: string;
  location?: string;
  patientNumber?: string;
  verificationChannel: PatientRegistrationVerificationChannel;
}

export interface PatientRegistrationResponse {
  patientRecordId: string;
  patientProfileId: string;
  patientNumber: string;
  status: PatientRecordStatus;
  registrationId: string;
  verificationStatus: string;
  verification: {
    challengeId: string;
    channel: string;
    target: string;
    expiresAt: string;
    deliveryStatus: string;
  };
}

export async function registerPatient(
  request: RegisterPatientRequest,
): Promise<PatientRegistrationResponse> {
  return authenticatedApiRequest<PatientRegistrationResponse>(
    '/v1/patients/register',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
}

export interface StaffPatientVerificationResponse {
  verified: boolean;
  channel: string;
  challengeId: string;
  verificationStatus: string;
  registrationStatus: string;
  onboardingEmailSent: boolean;
  patientRecord: {
    id: string;
    patientNumber: string;
    status: PatientRecordStatus;
  };
}

export async function verifyPatientRegistrationAsStaff(
  challengeId: string,
  code: string,
): Promise<StaffPatientVerificationResponse> {
  return authenticatedApiRequest<StaffPatientVerificationResponse>(
    '/v1/verification/patient-registration/staff/verify',
    {
      method: 'POST',
      body: JSON.stringify({
        challengeId,
        code,
      }),
    },
  );
}

export interface PatientRegistrationCodeResponse {
  challengeId: string;
  channel: string;
  target: string;
  expiresAt: string;
  deliveryStatus: string;
}

export async function sendPatientRegistrationCode(
  patientRecordId: string,
): Promise<PatientRegistrationCodeResponse> {
  return authenticatedApiRequest<PatientRegistrationCodeResponse>(
    `/v1/patients/${encodeURIComponent(patientRecordId)}/verification/send`,
    { method: 'POST' },
  );
}

export interface ExistingPatientLookupResponse {
  found: boolean;
  alreadyRegisteredWithOrganization: boolean;
  relationshipPending: boolean;
  patient: {
    patientProfileId: string;
    platformPatientId: string;
    firstName: string;
    secondName: string;
    displayName: string;
    location: string | null;
  };
  existingFacilityRecord: {
    id: string;
    patientNumber: string;
    status: PatientRecordStatus;
  } | null;
}

export async function findExistingPatient(
  identifier: string,
): Promise<ExistingPatientLookupResponse> {
  const params = new URLSearchParams({
    identifier,
  });

  return authenticatedApiRequest<ExistingPatientLookupResponse>(
    `/v1/patients/existing?${params.toString()}`,
  );
}

