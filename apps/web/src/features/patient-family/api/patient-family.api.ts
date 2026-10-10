import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  CreateDependentRegistrationRequest,
  FamilyAccessActivityResponse,
  FamilyAccessGrantResponse,
  FamilyAccessGrantsResponse,
  DependentRegistrationResponse,
  CreateFamilyRelationshipRequest,
  FamilyAccessPermission,
  DependentVerificationStatusResponse,
  FamilyRequestResponse,
  FamilyRequestsResponse,
  FamilyRelationshipResponse,
  FamilyRelationshipsResponse,
  RevokeFamilyRelationshipRequest,
  RespondFamilyRelationshipRequest,
} from '../types/patient-family.types.js';

export async function getFamilyAccessGrants(): Promise<FamilyAccessGrantsResponse> {
  return authenticatedApiRequest<FamilyAccessGrantsResponse>(
    '/v1/patient-family/access-grants',
  );
}

export async function createFamilyAccessGrant(payload: {
  patientId: string;
  delegateId: string;
  permissions: FamilyAccessPermission[];
  expiresAt?: string;
}, stepUpChallengeId: string): Promise<FamilyAccessGrantResponse> {
  return authenticatedApiRequest<FamilyAccessGrantResponse>(
    '/v1/patient-family/access-grants',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-step-up-challenge-id': stepUpChallengeId },
    },
  );
}

export async function updateFamilyAccessGrant(
  grantId: string,
  payload: {
    permissions?: FamilyAccessPermission[];
    expiresAt?: string;
  },
  stepUpChallengeId: string,
): Promise<FamilyAccessGrantResponse> {
  return authenticatedApiRequest<FamilyAccessGrantResponse>(
    `/v1/patient-family/access-grants/${encodeURIComponent(grantId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'x-step-up-challenge-id': stepUpChallengeId },
    },
  );
}

export async function revokeFamilyAccessGrant(
  grantId: string,
  stepUpChallengeId: string,
): Promise<FamilyAccessGrantResponse> {
  return authenticatedApiRequest<FamilyAccessGrantResponse>(
    `/v1/patient-family/access-grants/${encodeURIComponent(grantId)}/revoke`,
    { method: 'POST', headers: { 'x-step-up-challenge-id': stepUpChallengeId } },
  );
}

export async function getFamilyAccessActivity(
  grantId: string,
): Promise<FamilyAccessActivityResponse> {
  return authenticatedApiRequest<FamilyAccessActivityResponse>(
    `/v1/patient-family/access-grants/${encodeURIComponent(grantId)}/activity`,
  );
}

export async function reviewFamilyAccessGrant(
  grantId: string,
): Promise<FamilyAccessGrantResponse> {
  return authenticatedApiRequest<FamilyAccessGrantResponse>(
    `/v1/patient-family/access-grants/${encodeURIComponent(grantId)}/review`,
    { method: 'POST' },
  );
}

export async function getDependentVerificationStatus(
  registrationId: string,
): Promise<DependentVerificationStatusResponse> {
  return authenticatedApiRequest<DependentVerificationStatusResponse>(
    `/v1/patient-family/dependents/${encodeURIComponent(registrationId)}/status`,
  );
}

export async function uploadDependentVerificationDocument(
  registrationId: string,
  documentType: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.set('documentType', documentType);
  formData.set('file', file);
  await authenticatedApiRequest(
    `/v1/patient-family/dependents/${encodeURIComponent(registrationId)}/documents`,
    { method: 'POST', body: formData },
  );
}

export async function getFamilyRelationships(): Promise<FamilyRelationshipsResponse> {
  return authenticatedApiRequest<FamilyRelationshipsResponse>(
    '/v1/patient-family/relationships',
  );
}

export async function getFamilyRequests(): Promise<FamilyRequestsResponse> {
  return authenticatedApiRequest<FamilyRequestsResponse>(
    '/v1/patient-family/requests',
  );
}


export async function registerDependent(
  payload: CreateDependentRegistrationRequest,
): Promise<DependentRegistrationResponse> {
  return authenticatedApiRequest<DependentRegistrationResponse>(
    '/v1/patient-family/dependents',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function createFamilyRequest(
  payload: CreateFamilyRelationshipRequest,
): Promise<FamilyRequestResponse> {
  return authenticatedApiRequest<FamilyRequestResponse>(
    '/v1/patient-family/requests',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function respondToFamilyRequest(
  requestId: string,
  payload: RespondFamilyRelationshipRequest,
): Promise<FamilyRequestResponse> {
  return authenticatedApiRequest<FamilyRequestResponse>(
    `/v1/patient-family/requests/${encodeURIComponent(requestId)}/respond`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function cancelFamilyRequest(
  requestId: string,
): Promise<FamilyRequestResponse> {
  return authenticatedApiRequest<FamilyRequestResponse>(
    `/v1/patient-family/requests/${encodeURIComponent(requestId)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function revokeFamilyRelationship(
  relationshipId: string,
  payload: RevokeFamilyRelationshipRequest,
  stepUpChallengeId: string,
): Promise<FamilyRelationshipResponse> {
  return authenticatedApiRequest<FamilyRelationshipResponse>(
    `/v1/patient-family/relationships/${encodeURIComponent(relationshipId)}/revoke`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-step-up-challenge-id': stepUpChallengeId },
    },
  );
}
