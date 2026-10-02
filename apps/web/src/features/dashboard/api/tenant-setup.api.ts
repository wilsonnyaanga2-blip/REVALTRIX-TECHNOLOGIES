import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type { TenantSetupResponse } from '../types/tenant-setup.types.js';

export async function getTenantSetup(): Promise<TenantSetupResponse> {
  return authenticatedApiRequest<TenantSetupResponse>(
    '/v1/tenant-setup',
  );
}
