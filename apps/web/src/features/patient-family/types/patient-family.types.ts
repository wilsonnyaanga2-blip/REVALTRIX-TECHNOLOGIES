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
  dependentRegistration: {
    id: string;
    relationshipType: 'CHILD' | 'DEPENDENT';
    status: DependentRegistrationStatus;
    createdAt: string;
    dateOfBirth: string | null;
  } | null;
  guardianVerification: GuardianAuthority | null;
  patientCanRevoke: boolean;
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

export type DependentRegistrationStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export type GuardianAuthorityType =
  | 'PARENT'
  | 'LEGAL_GUARDIAN'
  | 'CAREGIVER'
  | 'AUTHORIZED_REPRESENTATIVE';

export type GuardianAuthorityStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'EXPIRED';

export type GuardianVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface CreateDependentRegistrationRequest {
  firstName: string;
  secondName: string;
  dateOfBirth: string;
  relationshipType: 'CHILD' | 'DEPENDENT';
  location?: string;
  reason?: string;
}

export interface DependentRegistration {
  id: string;
  relationshipType: 'CHILD' | 'DEPENDENT';
  status: DependentRegistrationStatus;
  createdAt: string;
}

export interface GuardianAuthority {
  id: string;
  authorityType: GuardianAuthorityType;
  status: GuardianAuthorityStatus;
  verificationStatus: GuardianVerificationStatus;
  startsAt: string;
  expiresAt: string | null;
}

export interface RegisteredDependent {
  id: string;
  platformPatientId: string;
  firstName: string;
  secondName: string;
  dateOfBirth: string | null;
  location: string | null;
}

export interface RegisteredDependentRelationship {
  id: string;
  relationshipType: FamilyRelationshipType;
  status: FamilyRelationshipStatus;
  createdAt: string;
  patientProfile: FamilyPatientSummary;
  relatedPatientProfile: FamilyPatientSummary & {
    dateOfBirth?: string | null;
  };
}

export interface DependentRegistrationResult {
  dependent: RegisteredDependent;
  registration: DependentRegistration;
  authority: GuardianAuthority;
  relationship: RegisteredDependentRelationship;
}

export interface DependentRegistrationResponse {
  data: DependentRegistrationResult;
}
