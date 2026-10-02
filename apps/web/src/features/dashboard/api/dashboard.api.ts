import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type { DashboardResponse } from '../types.js';

export async function getDashboard(): Promise<DashboardResponse> {
  return authenticatedApiRequest<DashboardResponse>(
    '/v1/dashboard',
  );
}
