import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  OrganizationResponse,
  UpdateOrganizationInput,
} from '../types/organization.types.js';

export async function getOrganization(): Promise<OrganizationResponse> {
  return authenticatedApiRequest<OrganizationResponse>(
    '/v1/organization',
  );
}

export async function updateOrganization(
  input: UpdateOrganizationInput,
): Promise<OrganizationResponse> {
  return authenticatedApiRequest<OrganizationResponse>(
    '/v1/organization',
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}
