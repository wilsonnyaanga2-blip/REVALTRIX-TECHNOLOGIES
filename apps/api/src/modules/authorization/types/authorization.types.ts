export interface AuthorizationContext {
  userId: string;
  membershipId: string;
  tenantId: string;
  branchId: string | null;
  departmentId: string | null;
  roleIds: string[];
}

export interface RequiredPermission {
  resource: string;
  action: string;
}
