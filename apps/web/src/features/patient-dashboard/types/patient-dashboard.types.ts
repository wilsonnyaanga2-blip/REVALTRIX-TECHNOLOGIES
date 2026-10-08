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

export interface PatientJourneyStep {
  id: string;
  sequence: number;
  type: string;
  status: string;
  name: string;
  description: string | null;
  location: string | null;
  instruction: string | null;
  estimatedWaitMinutes: number | null;
  estimatedDurationMinutes: number | null;
  readyAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  queue: {
    id: string;
    name: string;
    code: string;
  } | null;
  queueEntry: {
    id: string;
    queueNumber: string;
    priority: string;
    status: string;
    position: number | null;
    checkedInAt: string | null;
    calledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    reason?: string | null;
  } | null;
}

export interface PatientJourney {
  journey: {
    id: string;
    status: string;
    startedAt: string;
    encounterId: string | null;
  };
  current: PatientJourneyStep | null;
  next: PatientJourneyStep | null;
  future: PatientJourneyStep[];
  steps: PatientJourneyStep[];
}

export interface PatientJourneyResponse {
  data: PatientJourney[];
}
