export interface PatientDashboardIdentity {
  type: string;
  verified: boolean;
  verifiedAt: string | null;
}

export interface PatientDashboardFacility {
  patientRecordId: string;
  patientNumber: string;
  relationshipStatus: string;
  registeredAt: string;
  facility: {
    id: string;
    name: string;
    legalName: string | null;
    code: string;
    type: string;
    status: string;
  };
}

export interface PatientRelationshipRequest {
  id: string;
  status: string;
  reason: string | null;
  requestedAt: string;
  patientRecord: {
    id: string;
    patientNumber: string;
    status: string;
  };
  facility: {
    id: string;
    name: string;
    legalName: string | null;
    code: string;
    type: string;
    status: string;
  };
  requestedBy: {
    displayName: string;
  };
}

export interface PatientDashboardResponse {
  patient: {
    profileId: string;
    platformPatientId: string;
    userId: string;
    displayName: string;
    firstName: string;
    secondName: string;
    location: string | null;
    createdAt: string;
    updatedAt: string;
  };
  identities: PatientDashboardIdentity[];
  facilities: PatientDashboardFacility[];
  pendingRelationshipRequests: PatientRelationshipRequest[];
}
