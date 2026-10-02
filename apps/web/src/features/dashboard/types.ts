export type TenantType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'SPECIALIST_PRACTICE'
  | 'MEDICAL_CENTER'
  | 'DIAGNOSTIC_CENTER'
  | 'LABORATORY'
  | 'RADIOLOGY_CENTER'
  | 'PHARMACY'
  | 'DENTAL_CLINIC'
  | 'OPTICAL_CENTER'
  | 'MATERNITY_CENTER'
  | 'REHABILITATION_CENTER'
  | 'HOME_HEALTH_PROVIDER'
  | 'AMBULANCE_PROVIDER'
  | 'HEALTHCARE_NETWORK'
  | 'CORPORATE_HEALTH_PROVIDER'
  | 'INSURER'
  | 'EXTERNAL_PROVIDER'
  | 'OTHER_HEALTHCARE_PROVIDER';

export interface DashboardMembership {
  id: string;
  tenant: {
    id: string;
    name: string;
    type: TenantType;
  };
  branch: {
    id: string;
    name: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  roles: Array<{
    id: string;
    name: string;
    scope: string;
  }>;
}

export interface DashboardResponse {
  user: {
    id: string;
    displayName: string;
    username: string | null;
    status: string;
  };
  tenant: {
    id: string;
    name: string;
    legalName: string | null;
    type: TenantType;
    status: string;
  };
  membership: {
    id: string;
    branch: {
      id: string;
      name: string;
    } | null;
    department: {
      id: string;
      name: string;
    } | null;
    roles: Array<{
      id: string;
      name: string;
      scope: string;
    }>;
  };
  setup: {
    status: string;
    readinessPercent: number;
    readyAt: string | null;
    liveAt: string | null;
  };
  summary: {
    branches: number;
    departments: number;
    services: number;
    activeMembers: number;
    patients: number;
  };
  capabilities: {
    patients: 'AVAILABLE' | 'NOT_IMPLEMENTED';
    appointments: 'AVAILABLE' | 'NOT_IMPLEMENTED';
    providers: 'AVAILABLE' | 'NOT_IMPLEMENTED';
    encounters: 'AVAILABLE' | 'NOT_IMPLEMENTED';
    queue: 'AVAILABLE' | 'NOT_IMPLEMENTED';
    billing: 'AVAILABLE' | 'NOT_IMPLEMENTED';
  };
}
