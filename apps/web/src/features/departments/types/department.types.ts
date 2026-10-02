export interface DepartmentOrganization {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentBranch {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentParent {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentChild {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface DepartmentCounts {
  children: number;
  memberships: number;
  services: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  status: string;
  organizationId: string | null;
  branchId: string | null;
  parentId: string | null;
  organization?: DepartmentOrganization | null;
  branch?: DepartmentBranch | null;
  parent?: DepartmentParent | null;
  children?: DepartmentChild[];
  _count?: DepartmentCounts;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  organizationId?: string;
  branchId?: string;
  parentId?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  organizationId?: string | null;
  branchId?: string | null;
  parentId?: string | null;
}
