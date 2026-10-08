import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  CreateFamilyRelationshipRequest,
  FamilyRequestResponse,
  FamilyRequestsResponse,
  FamilyRelationshipResponse,
  FamilyRelationshipsResponse,
  RevokeFamilyRelationshipRequest,
  RespondFamilyRelationshipRequest,
} from '../types/patient-family.types.js';

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
  payload: RevokeFamilyRelationshipRequest = {},
): Promise<FamilyRelationshipResponse> {
  return authenticatedApiRequest<FamilyRelationshipResponse>(
    `/v1/patient-family/relationships/${encodeURIComponent(relationshipId)}/revoke`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
