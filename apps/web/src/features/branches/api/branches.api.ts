import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
} from '../types/branch.types.js';

export async function getBranches(): Promise<Branch[]> {
  return authenticatedApiRequest<Branch[]>('/v1/branches');
}

export async function getBranch(
  branchId: string,
): Promise<Branch> {
  return authenticatedApiRequest<Branch>(
    `/v1/branches/${branchId}`,
  );
}

export async function createBranch(
  input: CreateBranchInput,
): Promise<Branch> {
  return authenticatedApiRequest<Branch>(
    '/v1/branches',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateBranch(
  branchId: string,
  input: UpdateBranchInput,
): Promise<Branch> {
  return authenticatedApiRequest<Branch>(
    `/v1/branches/${branchId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deactivateBranch(
  branchId: string,
): Promise<{
  id: string;
  status: string;
  deletedAt: string;
}> {
  return authenticatedApiRequest<{
    id: string;
    status: string;
    deletedAt: string;
  }>(`/v1/branches/${branchId}`, {
    method: 'DELETE',
  });
}
