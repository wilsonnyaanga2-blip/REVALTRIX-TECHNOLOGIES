export interface HospitalDashboardResponse {
  tenant: {
    id: string;
    name: string;
    legalName: string | null;
    type: 'HOSPITAL';
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
    status:
      | 'NOT_STARTED'
      | 'IN_PROGRESS'
      | 'READY'
      | 'BLOCKED'
      | 'LIVE'
      | 'SUSPENDED';
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
