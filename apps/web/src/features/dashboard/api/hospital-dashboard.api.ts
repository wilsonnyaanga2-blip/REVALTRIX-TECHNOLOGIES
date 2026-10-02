import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type { HospitalDashboardResponse } from '../types/hospital-dashboard.types.js';

export async function getHospitalDashboard(): Promise<HospitalDashboardResponse> {
  return authenticatedApiRequest<HospitalDashboardResponse>(
    '/v1/dashboard/hospital',
  );
}
