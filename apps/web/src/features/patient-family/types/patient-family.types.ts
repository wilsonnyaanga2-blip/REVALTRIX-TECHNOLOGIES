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

export type FamilyRelationshipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'DECLINED'
  | 'CANCELLED'
  | 'REVOKED'
  | 'EXPIRED';

export type FamilyRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED';

export type FamilyRequestDirection = 'INCOMING' | 'OUTGOING';

export interface FamilyPatientSummary {
  id: string;
  platformPatientId: string;
  firstName: string;
  secondName: string | null;
  dateOfBirth?: string | null;
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
  targetIdentifier: string;
  relationshipType: FamilyRelationshipType;
  reason?: string;
}

export interface RespondFamilyRelationshipRequest {
  response: 'ACCEPT' | 'DECLINE';
  responseReason?: string;
}

export interface RevokeFamilyRelationshipRequest {
  reason?: string;
  revokeActiveAccessGrants?: boolean;
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
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
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
  verifiedAt: string | null;
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

export const FAMILY_ACCESS_PERMISSIONS = [
  'profile.read',
  'appointments.read',
  'appointments.manage',
  'reminders.read',
  'documents.read',
  'lab-results.read',
  'prescriptions.read',
  'billing.read',
  'billing.manage',
  'messages.send',
] as const;

export type FamilyAccessPermission =
  (typeof FAMILY_ACCESS_PERMISSIONS)[number];

export interface FamilyAccessGrant {
  id: string;
  patientId: string;
  delegateId: string;
  permissions: FamilyAccessPermission[];
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
  patient: {
    id: string;
    firstName: string;
    secondName: string;
    dateOfBirth: string | null;
  };
  delegate: {
    id: string;
    firstName: string;
    secondName: string;
  };
  relationship: {
    relationshipType: FamilyRelationshipType;
    status: FamilyRelationshipStatus;
  } | null;
  lastAccessAt: string | null;
  reviewDueAt: string;
}

export interface FamilyAccessGrantResponse {
  data: FamilyAccessGrant;
}

export interface FamilyAccessGrantsResponse {
  data: FamilyAccessGrant[];
  adolescentPolicy?: {
    minimumAge: number;
    restrictedPermissions: string[];
  };
}

export interface FamilyAccessAuditRecord {
  id: string;
  accessGrantId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface FamilyAccessActivityResponse {
  data: FamilyAccessAuditRecord[];
}

export interface DependentVerificationStatus {
  id: string;
  status: string;
  verificationNotes: string | null;
  reviewedAt: string | null;
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileSize: string;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
  }>;
}

export interface DependentVerificationStatusResponse {
  data: DependentVerificationStatus;
}
