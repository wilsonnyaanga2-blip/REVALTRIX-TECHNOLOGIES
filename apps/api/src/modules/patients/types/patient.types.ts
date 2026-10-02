export interface PatientTenantContext {
  userId: string;
  membershipId: string;
  tenantId: string;
  branchId: string | null;
  departmentId: string | null;
  roleIds: string[];
}

export interface PatientListItem {
  id: string;
  patientNumber: string;
  status: string;
  registeredAt: Date;
  patient: {
    profileId: string;
    platformPatientId: string;
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
