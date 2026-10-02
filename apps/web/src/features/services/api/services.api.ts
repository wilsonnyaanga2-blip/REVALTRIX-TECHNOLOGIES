import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  CreateServiceInput,
  Service,
  UpdateServiceInput,
} from '../types/service.types.js';

export async function getServices(): Promise<Service[]> {
  return authenticatedApiRequest<Service[]>(
    '/v1/services',
  );
}

export async function getService(
  serviceId: string,
): Promise<Service> {
  return authenticatedApiRequest<Service>(
    `/v1/services/${serviceId}`,
  );
}

export async function createService(
  input: CreateServiceInput,
): Promise<Service> {
  return authenticatedApiRequest<Service>(
    '/v1/services',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateService(
  serviceId: string,
  input: UpdateServiceInput,
): Promise<Service> {
  return authenticatedApiRequest<Service>(
    `/v1/services/${serviceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deactivateService(
  serviceId: string,
): Promise<{ id: string; deleted: boolean }> {
  return authenticatedApiRequest<{
    id: string;
    deleted: boolean;
  }>(
    `/v1/services/${serviceId}`,
    {
      method: 'DELETE',
    },
  );
}
