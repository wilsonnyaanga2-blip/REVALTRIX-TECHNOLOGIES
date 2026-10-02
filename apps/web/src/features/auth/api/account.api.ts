import { authenticatedApiRequest } from '../../../lib/auth-api.js';

export interface AccountResolutionResponse {
  accountType: 'PATIENT' | 'TENANT' | 'UNASSIGNED';
  patient?: {
    profileId: string;
    platformPatientId: string;
  };
  tenant?: {
    membershipId: string;
    tenantId: string;
  };
}

export async function resolveAuthenticatedAccount(): Promise<AccountResolutionResponse> {
  return authenticatedApiRequest<AccountResolutionResponse>(
    '/v1/core/account/me',
  );
}
