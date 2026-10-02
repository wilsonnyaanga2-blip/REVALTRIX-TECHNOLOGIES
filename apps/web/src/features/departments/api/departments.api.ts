import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  CreateDepartmentInput,
  Department,
  UpdateDepartmentInput,
} from '../types/department.types.js';

export async function getDepartments(): Promise<Department[]> {
  return authenticatedApiRequest<Department[]>(
    '/v1/departments',
  );
}

export async function getDepartment(
  departmentId: string,
): Promise<Department> {
  return authenticatedApiRequest<Department>(
    `/v1/departments/${departmentId}`,
  );
}

export async function createDepartment(
  input: CreateDepartmentInput,
): Promise<Department> {
  return authenticatedApiRequest<Department>(
    '/v1/departments',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateDepartment(
  departmentId: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  return authenticatedApiRequest<Department>(
    `/v1/departments/${departmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deactivateDepartment(
  departmentId: string,
): Promise<{
  id: string;
  status: string;
  deletedAt: string;
}> {
  return authenticatedApiRequest<{
    id: string;
    status: string;
    deletedAt: string;
  }>(`/v1/departments/${departmentId}`, {
    method: 'DELETE',
  });
}
