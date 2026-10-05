export const FAMILY_RELATIONSHIP_TYPES = [
  'SPOUSE',
  'PARENT',
  'CHILD',
  'SIBLING',
  'GRANDPARENT',
  'GRANDCHILD',
  'GUARDIAN',
  'DEPENDENT',
  'OTHER',
] as const;

export type FamilyRelationshipType =
  (typeof FAMILY_RELATIONSHIP_TYPES)[number];

export type FamilyRelationshipStatus = 'ACTIVE' | 'REVOKED';

export type FamilyRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED';

export type FamilyRequestDirection = 'INCOMING' | 'OUTGOING';

export interface FamilyPatientSummary {
  id: string;
  platformPatientId: string;
  firstName: string;
  secondName: string | null;
}

export interface FamilyRelationship {
  id: string;
  relationshipType: FamilyRelationshipType;
  status: FamilyRelationshipStatus;
  createdAt: string;
  revokedAt: string | null;
  patient: FamilyPatientSummary;
  relatedPatient: FamilyPatientSummary;
  direction: 'INCOMING' | 'OUTGOING';
}

export interface FamilyRelationshipRequest {
  id: string;
  relationshipType: FamilyRelationshipType;
  status: FamilyRequestStatus;
  reason: string | null;
  requestedAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
  requesterPatientProfile: FamilyPatientSummary;
  targetPatientProfile: FamilyPatientSummary;
  direction: FamilyRequestDirection;
}

export interface CreateFamilyRelationshipRequest {
  targetPlatformPatientId: string;
  relationshipType: FamilyRelationshipType;
  reason?: string;
}

export interface RespondFamilyRelationshipRequest {
  response: 'ACCEPT' | 'DECLINE';
  responseReason?: string;
}

export interface RevokeFamilyRelationshipRequest {
  reason?: string;
}

export interface FamilyRelationshipsResponse {
  data: FamilyRelationship[];
}

export interface FamilyRequestsResponse {
  data: FamilyRelationshipRequest[];
}

export interface FamilyRelationshipResponse {
  data: FamilyRelationship;
}

export interface FamilyRequestResponse {
  data: FamilyRelationshipRequest;
}
